// This file belongs to the entity package (database tables)
package com.enterprise.audit.entity;

// We need the JPA annotations that map this class to a table
import jakarta.persistence.*;

// We need this type for the time
import java.time.LocalDateTime;
// We need this type for ids
import java.util.UUID;

// Says this class is a database table
@Entity
// The table is called audit_logs, with two indexes to make searches fast
@Table(name = "audit_logs", indexes = {
        // Makes searching by user fast
        @Index(name = "idx_audit_user_id", columnList = "userId"),
        // Makes searching by time fast
        @Index(name = "idx_audit_timestamp", columnList = "timestamp")
})
// One row = one thing a user did (like a chat)
public class AuditLog {

    // This field is the primary key
    @Id
    // The database makes a new random UUID for each row
    @GeneratedValue(strategy = GenerationType.UUID)
    // The id of this record
    private UUID id;

    // This column can't be empty
    @Column(nullable = false)
    // The user who did the action
    private String userId;

    // The session the action happened in (can be empty)
    private String sessionId;

    // This column can't be empty
    @Column(nullable = false)
    // What the user did (like CHAT)
    private String action;

    // How many tokens the action used (can be empty)
    private Integer tokenCount;

    // This column can't be empty
    @Column(nullable = false)
    // When the action happened
    private LocalDateTime timestamp;

    // Where the request came from (can be empty)
    private String ipAddress;

    // Read the id (there is no setter because the database makes it)
    public UUID getId() { return id; }

    // Read the user id
    public String getUserId() { return userId; }
    // Set the user id
    public void setUserId(String userId) { this.userId = userId; }

    // Read the session id
    public String getSessionId() { return sessionId; }
    // Set the session id
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    // Read the action
    public String getAction() { return action; }
    // Set the action
    public void setAction(String action) { this.action = action; }

    // Read the token count
    public Integer getTokenCount() { return tokenCount; }
    // Set the token count
    public void setTokenCount(Integer tokenCount) { this.tokenCount = tokenCount; }

    // Read the time
    public LocalDateTime getTimestamp() { return timestamp; }
    // Set the time
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    // Read the IP address
    public String getIpAddress() { return ipAddress; }
    // Set the IP address
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
}
