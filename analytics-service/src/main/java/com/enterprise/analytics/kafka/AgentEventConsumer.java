// This file belongs to the kafka package
package com.enterprise.analytics.kafka;

// The database class for one day of user totals
import com.enterprise.analytics.entity.DailyMetrics;
// The database class for one pipeline run
import com.enterprise.analytics.entity.PipelineEvent;
// Database access for daily totals
import com.enterprise.analytics.repository.DailyMetricsRepository;
// Database access for pipeline runs
import com.enterprise.analytics.repository.PipelineEventRepository;
// One piece of JSON data
import com.fasterxml.jackson.databind.JsonNode;
// Reads and writes JSON
import com.fasterxml.jackson.databind.ObjectMapper;
// One message we got from Kafka
import org.apache.kafka.clients.consumer.ConsumerRecord;
// Marks a method that listens to a Kafka topic
import org.springframework.kafka.annotation.KafkaListener;
// Lets us tell Kafka "I finished this message"
import org.springframework.kafka.support.Acknowledgment;
// Makes this class a Spring-managed object
import org.springframework.stereotype.Component;

// A type for a date (no time)
import java.time.LocalDate;
// A type for date and time
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
// Makes this class a Spring-managed object
@Component
// This class listens to Kafka and updates the usage totals
public class AgentEventConsumer {

    // Used to read and save daily totals
    private final DailyMetricsRepository dailyMetricsRepository;
    // Used to save pipeline runs
    private final PipelineEventRepository pipelineEventRepository;
    // Used to read JSON
    private final ObjectMapper objectMapper;

    // Spring gives us all the helpers when it creates this class
    public AgentEventConsumer(
            // For daily totals
            DailyMetricsRepository dailyMetricsRepository,
            // For pipeline runs
            PipelineEventRepository pipelineEventRepository,
            // For JSON
            ObjectMapper objectMapper
    ) {
        // Save the daily totals repository
        this.dailyMetricsRepository = dailyMetricsRepository;
        // Save the pipeline runs repository
        this.pipelineEventRepository = pipelineEventRepository;
        // Save the JSON tool
        this.objectMapper = objectMapper;
    }

    // Runs every time a new message arrives on the "agent-events" topic
    @KafkaListener(topics = "agent-events", groupId = "${spring.kafka.consumer.group-id}")
    public void consume(ConsumerRecord<String, String> record, Acknowledgment ack) {
        // Reading and saving can fail, so we use try
        try {
            // Turn the message text into a JSON tree
            JsonNode event = objectMapper.readTree(record.value());

            // Read the user id (or "unknown" if missing)
            String userId    = event.path("userId").asText("unknown");
            // Read the session id (or "unknown" if missing)
            String sessionId = event.path("sessionId").asText("unknown");
            // Read the action (or "UNKNOWN" if missing)
            String action    = event.path("action").asText("UNKNOWN");
            // Read the token count (or 0 if missing)
            int tokenCount   = event.path("tokenCount").asInt(0);
            // Get today's date
            LocalDate today  = LocalDate.now();

            // --- Upsert DailyMetrics (find today's row or create a new one) ---
            // Look for today's row for this user
            DailyMetrics metrics = dailyMetricsRepository
                    .findByUserIdAndDate(userId, today)
                    // If there is none, make a new one
                    .orElseGet(() -> {
                        // Make a new empty row
                        DailyMetrics m = new DailyMetrics();
                        // Set the user
                        m.setUserId(userId);
                        m.setTeamId("default");   // enriched later when teamId flows in Kafka
                        // Set the date to today
                        m.setDate(today);
                        // Start the request count at 0
                        m.setRequestCount(0);
                        // Start the token count at 0
                        m.setTotalTokens(0);
                        // Start the error count at 0
                        m.setErrorCount(0);
                        // Give the new row back
                        return m;
                    });

            // Add one request to today's total
            metrics.setRequestCount(metrics.getRequestCount() + 1);
            // Add this event's tokens to today's total
            metrics.setTotalTokens(metrics.getTotalTokens() + tokenCount);
            // Save the updated row
            dailyMetricsRepository.save(metrics);

            // --- Track pipeline events separately ---
            // Agent-service sets action="WEBHOOK_ANALYZE" for GitHub webhook pushes.
            // sessionId in that context holds the repo name (set in AgentService.analyzeWebhook).
            // If the action mentions WEBHOOK, this event is a GitHub pipeline run
            if (action != null && action.toUpperCase().contains("WEBHOOK")) {
                // Make a new pipeline run row
                PipelineEvent pipelineEvent = new PipelineEvent();
                // The repository name is stored in the session id field
                pipelineEvent.setRepoName(sessionId);
                // Record when we processed it
                pipelineEvent.setProcessedAt(LocalDateTime.now());
                // Record how many tokens it used
                pipelineEvent.setTokenCount(tokenCount);
                // Save the row
                pipelineEventRepository.save(pipelineEvent);
            }

            // Only acknowledge after ALL DB writes succeed
            // Tell Kafka we are done with this message
            ack.acknowledge();

        } catch (Exception e) {
            // Do NOT acknowledge — Kafka re-delivers after restart
            // Print the problem so we can see it
            System.err.println("Failed to process analytics event, will retry: " + e.getMessage());
        }
    }
}
