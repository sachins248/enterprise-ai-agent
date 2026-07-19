package com.enterprise.analytics.kafka;

import com.enterprise.analytics.entity.DailyMetrics;
import com.enterprise.analytics.entity.PipelineEvent;
import com.enterprise.analytics.repository.DailyMetricsRepository;
import com.enterprise.analytics.repository.PipelineEventRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Consumes agent-events independently of the audit-service consumer.
 *
 * Why two consumers? Kafka fan-out: because analytics uses a different
 * consumer group ("analytics-group" vs "audit-group"), Kafka delivers
 * every message to BOTH groups. Each service processes events for its
 * own purpose — audit builds an audit trail, analytics aggregates metrics.
 *
 * Manual acknowledgment (ack-mode=manual in application.properties):
 * ack.acknowledge() is called AFTER all DB writes succeed. If this service
 * crashes mid-processing, Kafka re-delivers the event on restart. This means
 * DailyMetrics might be incremented twice for the same event (at-least-once
 * delivery). For analytics, slight over-counting is acceptable.
 */
@Component
public class AgentEventConsumer {

    private final DailyMetricsRepository dailyMetricsRepository;
    private final PipelineEventRepository pipelineEventRepository;
    private final ObjectMapper objectMapper;

    public AgentEventConsumer(
            DailyMetricsRepository dailyMetricsRepository,
            PipelineEventRepository pipelineEventRepository,
            ObjectMapper objectMapper
    ) {
        this.dailyMetricsRepository = dailyMetricsRepository;
        this.pipelineEventRepository = pipelineEventRepository;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "agent-events", groupId = "${spring.kafka.consumer.group-id}")
    public void consume(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            JsonNode event = objectMapper.readTree(record.value());

            String userId    = event.path("userId").asText("unknown");
            String sessionId = event.path("sessionId").asText("unknown");
            String action    = event.path("action").asText("UNKNOWN");
            int tokenCount   = event.path("tokenCount").asInt(0);
            LocalDate today  = LocalDate.now();

            // --- Upsert DailyMetrics (find today's row or create a new one) ---
            DailyMetrics metrics = dailyMetricsRepository
                    .findByUserIdAndDate(userId, today)
                    .orElseGet(() -> {
                        DailyMetrics m = new DailyMetrics();
                        m.setUserId(userId);
                        m.setTeamId("default");   // enriched later when teamId flows in Kafka
                        m.setDate(today);
                        m.setRequestCount(0);
                        m.setTotalTokens(0);
                        m.setErrorCount(0);
                        return m;
                    });

            metrics.setRequestCount(metrics.getRequestCount() + 1);
            metrics.setTotalTokens(metrics.getTotalTokens() + tokenCount);
            dailyMetricsRepository.save(metrics);

            // --- Track pipeline events separately ---
            // Agent-service sets action="WEBHOOK_ANALYZE" for GitHub webhook pushes.
            // sessionId in that context holds the repo name (set in AgentService.analyzeWebhook).
            if (action != null && action.toUpperCase().contains("WEBHOOK")) {
                PipelineEvent pipelineEvent = new PipelineEvent();
                pipelineEvent.setRepoName(sessionId);
                pipelineEvent.setProcessedAt(LocalDateTime.now());
                pipelineEvent.setTokenCount(tokenCount);
                pipelineEventRepository.save(pipelineEvent);
            }

            // Only acknowledge after ALL DB writes succeed
            ack.acknowledge();

        } catch (Exception e) {
            // Do NOT acknowledge — Kafka re-delivers after restart
            System.err.println("Failed to process analytics event, will retry: " + e.getMessage());
        }
    }
}
