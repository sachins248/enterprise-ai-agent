// This file belongs to the kafka package
package com.enterprise.audit.kafka;

// The database class for one audit record
import com.enterprise.audit.entity.AuditLog;
// Database access for audit records
import com.enterprise.audit.repository.AuditLogRepository;
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

// A type for a moment in time
import java.time.Instant;
// A type for date and time
import java.time.LocalDateTime;
// Used to say the time is in UTC
import java.time.ZoneOffset;

// Makes this class a Spring-managed object
@Component
// This class listens to Kafka and saves an audit record for each agent event
public class AgentEventConsumer {

    // Used to save audit records
    private final AuditLogRepository auditLogRepository;
    // Used to read JSON
    private final ObjectMapper objectMapper;

    // Spring gives us both helpers when it creates this class
    public AgentEventConsumer(AuditLogRepository auditLogRepository, ObjectMapper objectMapper) {
        // Save the repository
        this.auditLogRepository = auditLogRepository;
        // Save the JSON tool
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
    // Runs every time a new message arrives on the "agent-events" topic
    @KafkaListener(topics = "agent-events", groupId = "${spring.kafka.consumer.group-id}")
    public void consume(ConsumerRecord<String, String> record, Acknowledgment ack) {
        // Reading and saving can fail, so we use try
        try {
            // Turn the message text into a JSON tree
            JsonNode event = objectMapper.readTree(record.value());

            // Make a new empty audit record
            AuditLog log = new AuditLog();
            // Set the user id (or "unknown" if missing)
            log.setUserId(event.path("userId").asText("unknown"));
            // Set the session id (or null if missing)
            log.setSessionId(event.path("sessionId").asText(null));
            // Set the action (or "UNKNOWN" if missing)
            log.setAction(event.path("action").asText("UNKNOWN"));
            // Set the token count (or 0 if missing)
            log.setTokenCount(event.path("tokenCount").asInt(0));
            log.setIpAddress("kafka-event");  // IP not available from async events

            // Read the time the event happened (or null if missing)
            String timestampStr = event.path("timestamp").asText(null);
            // If the event has a time, use it
            if (timestampStr != null) {
                // Turn the text into a time in UTC
                log.setTimestamp(LocalDateTime.ofInstant(Instant.parse(timestampStr), ZoneOffset.UTC));
            } else {
                // No time given, so use the current time
                log.setTimestamp(LocalDateTime.now());
            }

            // Write to DB first — THEN acknowledge
            // Save the record in the database
            auditLogRepository.save(log);
            // Tell Kafka we are done with this message
            ack.acknowledge();

        } catch (Exception e) {
            // Do NOT acknowledge on failure — Kafka will redeliver after restart
            // Print the problem so we can see it
            System.err.println("Failed to process agent event, will retry: " + e.getMessage());
        }
    }
}
