package com.enterprise.analytics.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

/**
 * One row per (userId, date) — updated in-place as events arrive.
 *
 * The unique constraint prevents duplicate rows if the consumer
 * processes the same event more than once on the same day.
 */
@Entity
@Table(
    name = "daily_metrics",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "metric_date"})
)
public class DailyMetrics {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    // teamId comes from future Kafka event enrichment; defaults to "default"
    @Column(name = "team_id")
    private String teamId;

    @Column(name = "metric_date", nullable = false)
    private LocalDate date;

    @Column(name = "request_count")
    private int requestCount;

    @Column(name = "total_tokens")
    private int totalTokens;

    @Column(name = "error_count")
    private int errorCount;

    // --- Getters / Setters (no Lombok) ---

    public UUID getId() { return id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getTeamId() { return teamId; }
    public void setTeamId(String teamId) { this.teamId = teamId; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public int getRequestCount() { return requestCount; }
    public void setRequestCount(int requestCount) { this.requestCount = requestCount; }

    public int getTotalTokens() { return totalTokens; }
    public void setTotalTokens(int totalTokens) { this.totalTokens = totalTokens; }

    public int getErrorCount() { return errorCount; }
    public void setErrorCount(int errorCount) { this.errorCount = errorCount; }
}
