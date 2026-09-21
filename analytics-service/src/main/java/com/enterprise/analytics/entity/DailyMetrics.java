// This file belongs to the entity package (database tables)
package com.enterprise.analytics.entity;

// We need the JPA annotations that map this class to a table
import jakarta.persistence.*;
// A type for a date (no time)
import java.time.LocalDate;
// We need this type for ids
import java.util.UUID;

/**
 * One row per (userId, date) — updated in-place as events arrive.
 *
 * The unique constraint prevents duplicate rows if the consumer
 * processes the same event more than once on the same day.
 */
// Says this class is a database table
@Entity
// The table is called daily_metrics
@Table(
    name = "daily_metrics",
    // A user can only have one row per day
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "metric_date"})
)
// One row = one user's totals for one day
public class DailyMetrics {

    // This field is the primary key
    @Id
    // The database makes a new random UUID for each row
    @GeneratedValue(strategy = GenerationType.UUID)
    // The id of this row
    private UUID id;

    // This column is called user_id and can't be empty
    @Column(name = "user_id", nullable = false)
    // The user these numbers belong to
    private String userId;

    // teamId comes from future Kafka event enrichment; defaults to "default"
    // This column is called team_id
    @Column(name = "team_id")
    // The team the user belongs to
    private String teamId;

    // This column is called metric_date and can't be empty
    @Column(name = "metric_date", nullable = false)
    // The day these numbers are for
    private LocalDate date;

    // This column is called request_count
    @Column(name = "request_count")
    // How many requests the user made that day
    private int requestCount;

    // This column is called total_tokens
    @Column(name = "total_tokens")
    // How many tokens the user used that day
    private int totalTokens;

    // This column is called error_count
    @Column(name = "error_count")
    // How many errors happened that day
    private int errorCount;

    // --- Getters / Setters (no Lombok) ---

    // Read the id (there is no setter because the database makes it)
    public UUID getId() { return id; }

    // Read the user id
    public String getUserId() { return userId; }
    // Set the user id
    public void setUserId(String userId) { this.userId = userId; }

    // Read the team id
    public String getTeamId() { return teamId; }
    // Set the team id
    public void setTeamId(String teamId) { this.teamId = teamId; }

    // Read the date
    public LocalDate getDate() { return date; }
    // Set the date
    public void setDate(LocalDate date) { this.date = date; }

    // Read the request count
    public int getRequestCount() { return requestCount; }
    // Set the request count
    public void setRequestCount(int requestCount) { this.requestCount = requestCount; }

    // Read the token count
    public int getTotalTokens() { return totalTokens; }
    // Set the token count
    public void setTotalTokens(int totalTokens) { this.totalTokens = totalTokens; }

    // Read the error count
    public int getErrorCount() { return errorCount; }
    // Set the error count
    public void setErrorCount(int errorCount) { this.errorCount = errorCount; }
}
