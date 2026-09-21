// This file belongs to the entity package (database tables)
package com.enterprise.agent.entity;

// We need the JPA annotations that map this class to a table
import jakarta.persistence.*;

// We need this type for the created time
import java.time.LocalDateTime;
// We need this type for ids
import java.util.UUID;

// Says this class is a database table
@Entity
// The table is called agent_sessions
@Table(name = "agent_sessions")
// One row = one chat conversation
public class AgentSession {

    // This field is the primary key
    @Id
    // The database makes a new random UUID for each row
    @GeneratedValue(strategy = GenerationType.UUID)
    // The id of this session
    private UUID id;

    // This column can't be empty
    @Column(nullable = false)
    // The user who owns this session
    private UUID userId;

    // A short name for the session (can be empty)
    private String title;

    // This column can't be empty
    @Column(nullable = false)
    // When the session was created
    private LocalDateTime createdAt;

    // Runs just before the row is saved for the first time
    @PrePersist
    protected void onCreate() {
        // Set the created time to right now
        createdAt = LocalDateTime.now();
    }

    // Read the id (there is no setter because the database makes it)
    public UUID getId() { return id; }

    // Read the owner's id
    public UUID getUserId() { return userId; }
    // Set the owner's id
    public void setUserId(UUID userId) { this.userId = userId; }

    // Read the title
    public String getTitle() { return title; }
    // Set the title
    public void setTitle(String title) { this.title = title; }

    // Read the created time (no setter because it is set automatically)
    public LocalDateTime getCreatedAt() { return createdAt; }
}
