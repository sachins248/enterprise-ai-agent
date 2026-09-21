// This file belongs to the entity package (database tables)
package com.enterprise.agent.entity;

// We need the MessageRole type
import com.enterprise.agent.enums.MessageRole;
// We need the JPA annotations that map this class to a table
import jakarta.persistence.*;

// We need this type for the created time
import java.time.LocalDateTime;
// We need this type for ids
import java.util.UUID;

// Says this class is a database table
@Entity
// The table is called agent_messages
@Table(name = "agent_messages")
// One row = one chat message
public class AgentMessage {

    // This field is the primary key
    @Id
    // The database makes a new random UUID for each row
    @GeneratedValue(strategy = GenerationType.UUID)
    // The id of this message
    private UUID id;

    // This column can't be empty
    @Column(nullable = false)
    // The session this message belongs to
    private UUID sessionId;

    // Save the role as text (like "USER") instead of a number
    @Enumerated(EnumType.STRING)
    // This column can't be empty
    @Column(nullable = false)
    // Who wrote the message (USER or ASSISTANT)
    private MessageRole role;

    // This column can't be empty and uses a big text type because answers can be long
    @Column(nullable = false, columnDefinition = "TEXT")
    // The text of the message
    private String content;

    // About how many tokens the message used (can be empty)
    private Integer tokenCount;

    // This column can't be empty
    @Column(nullable = false)
    // When the message was saved
    private LocalDateTime createdAt;

    // Runs just before the row is saved for the first time
    @PrePersist
    protected void onCreate() {
        // Set the created time to right now
        createdAt = LocalDateTime.now();
    }

    // Read the id (there is no setter because the database makes it)
    public UUID getId() { return id; }

    // Read the session id
    public UUID getSessionId() { return sessionId; }
    // Set the session id
    public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }

    // Read the role
    public MessageRole getRole() { return role; }
    // Set the role
    public void setRole(MessageRole role) { this.role = role; }

    // Read the message text
    public String getContent() { return content; }
    // Set the message text
    public void setContent(String content) { this.content = content; }

    // Read the token count
    public Integer getTokenCount() { return tokenCount; }
    // Set the token count
    public void setTokenCount(Integer tokenCount) { this.tokenCount = tokenCount; }

    // Read the created time (no setter because it is set automatically)
    public LocalDateTime getCreatedAt() { return createdAt; }
}
