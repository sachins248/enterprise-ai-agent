package com.enterprise.audit.kafka;

import com.enterprise.audit.entity.AuditLog;
import com.enterprise.audit.repository.AuditLogRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Component
public class AgentEventConsumer {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public AgentEventConsumer(AuditLogRepository auditLogRepository, ObjectMapper objectMapper) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Consumes messages from agent-events with manual acknowledgment.
     *
     * Manual ack means: we only tell Kafka "I processed this message" AFTER
     * the database write succeeds. If the DB write fails and the app crashes,
     * Kafka will re-deliver the message on restart (at-least-once guarantee).
     *
     * The tradeoff: if the DB write succeeds but the ack fails, the message
     * is processed twice — so AuditLog writes should be idempotent-friendly
     * (duplicate logs are acceptable for audit purposes).
     */
    @KafkaListener(topics = "agent-events", groupId = "${spring.kafka.consumer.group-id}")
    public void consume(ConsumerRecord<String, String> record, Acknowledgment ack) {
        try {
            JsonNode event = objectMapper.readTree(record.value());

            AuditLog log = new AuditLog();
            log.setUserId(event.path("userId").asText("unknown"));
            log.setSessionId(event.path("sessionId").asText(null));
            log.setAction(event.path("action").asText("UNKNOWN"));
            log.setTokenCount(event.path("tokenCount").asInt(0));
            log.setIpAddress("kafka-event");  // IP not available from async events

            String timestampStr = event.path("timestamp").asText(null);
            if (timestampStr != null) {
                log.setTimestamp(LocalDateTime.ofInstant(Instant.parse(timestampStr), ZoneOffset.UTC));
            } else {
                log.setTimestamp(LocalDateTime.now());
            }

            // Write to DB first — THEN acknowledge
            auditLogRepository.save(log);
            ack.acknowledge();

        } catch (Exception e) {
            // Do NOT acknowledge on failure — Kafka will redeliver after restart
            System.err.println("Failed to process agent event, will retry: " + e.getMessage());
        }
    }
}
