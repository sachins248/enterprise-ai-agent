// This file belongs to the entity package (database tables)
package com.enterprise.analytics.entity;

// We need the JPA annotations that map this class to a table
import jakarta.persistence.*;
// A type for date and time
import java.time.LocalDateTime;
// We need this type for ids
import java.util.UUID;

/**
 * Records each GitHub webhook push that was analyzed by Gemini.
 * Populated by the Kafka consumer when it sees action="WEBHOOK_ANALYZE".
 */
// Says this class is a database table
@Entity
// The table is called pipeline_events
@Table(name = "pipeline_events")
// One row = one GitHub push that the AI analyzed
public class PipelineEvent {

    // This field is the primary key
    @Id
    // The database makes a new random UUID for each row
    @GeneratedValue(strategy = GenerationType.UUID)
    // The id of this row
    private UUID id;

    // This column is called repo_name and can't be empty
    @Column(name = "repo_name", nullable = false)
    // The repository that was pushed to
    private String repoName;

    // This column is called processed_at and can't be empty
    @Column(name = "processed_at", nullable = false)
    // When the analysis happened
    private LocalDateTime processedAt;

    // This column is called token_count
    @Column(name = "token_count")
    // How many tokens the analysis used
    private int tokenCount;

    // --- Getters / Setters ---

    // Read the id (there is no setter because the database makes it)
    public UUID getId() { return id; }

    // Read the repository name
    public String getRepoName() { return repoName; }
    // Set the repository name
    public void setRepoName(String repoName) { this.repoName = repoName; }

    // Read the processed time
    public LocalDateTime getProcessedAt() { return processedAt; }
    // Set the processed time
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }

    // Read the token count
    public int getTokenCount() { return tokenCount; }
    // Set the token count
    public void setTokenCount(int tokenCount) { this.tokenCount = tokenCount; }
}
