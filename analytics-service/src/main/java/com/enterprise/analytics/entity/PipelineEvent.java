package com.enterprise.analytics.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Records each GitHub webhook push that was analyzed by Gemini.
 * Populated by the Kafka consumer when it sees action="WEBHOOK_ANALYZE".
 */
@Entity
@Table(name = "pipeline_events")
public class PipelineEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "repo_name", nullable = false)
    private String repoName;

    @Column(name = "processed_at", nullable = false)
    private LocalDateTime processedAt;

    @Column(name = "token_count")
    private int tokenCount;

    // --- Getters / Setters ---

    public UUID getId() { return id; }

    public String getRepoName() { return repoName; }
    public void setRepoName(String repoName) { this.repoName = repoName; }

    public LocalDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }

    public int getTokenCount() { return tokenCount; }
    public void setTokenCount(int tokenCount) { this.tokenCount = tokenCount; }
}
