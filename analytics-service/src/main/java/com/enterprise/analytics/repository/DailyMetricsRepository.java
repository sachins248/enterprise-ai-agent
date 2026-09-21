// This file belongs to the repository package (database access)
package com.enterprise.analytics.repository;

// The table class for daily totals
import com.enterprise.analytics.entity.DailyMetrics;
// This gives us ready-made save, find and delete methods
import org.springframework.data.jpa.repository.JpaRepository;
// Lets us write our own database query
import org.springframework.data.jpa.repository.Query;
// Lets us pass a value into a query
import org.springframework.data.repository.query.Param;

// A type for a date (no time)
import java.time.LocalDate;
// Used for lists
import java.util.List;
// Optional means "the result might be empty"
import java.util.Optional;
// We need this type for ids
import java.util.UUID;

// Database access for daily totals (the id type is UUID)
public interface DailyMetricsRepository extends JpaRepository<DailyMetrics, UUID> {

    /** Used by the Kafka consumer to upsert today's row. */
    // Find one user's row for one day
    Optional<DailyMetrics> findByUserIdAndDate(String userId, LocalDate date);

    /** Used by GET /analytics/usage — last N days for a specific user. */
    // Find one user's rows between two dates, oldest first
    List<DailyMetrics> findByUserIdAndDateBetweenOrderByDateAsc(
            String userId, LocalDate from, LocalDate to);

    /**
     * Aggregates all teams over the last 30 days.
     *
     * The aliases (teamId, totalUsers, etc.) must exactly match the
     * getter names in TeamAggregate (minus "get", camelCase).
     * Spring Data generates a proxy that implements the interface.
     */
    // Our own query: add up the numbers for each team since a date
    @Query("""
            SELECT m.teamId  AS teamId,
                   COUNT(DISTINCT m.userId) AS totalUsers,
                   SUM(m.requestCount)      AS totalRequests,
                   SUM(m.totalTokens)       AS totalTokens
            FROM DailyMetrics m
            WHERE m.date >= :since
            GROUP BY m.teamId
            """)
    // Runs the query above with the given start date
    List<TeamAggregate> aggregateAllTeams(@Param("since") LocalDate since);

    /**
     * Same aggregation filtered to one specific team.
     * Returns a list because the projection interface requires it,
     * but there will only ever be 0 or 1 result.
     */
    // Our own query: add up the numbers for one team since a date
    @Query("""
            SELECT m.teamId  AS teamId,
                   COUNT(DISTINCT m.userId) AS totalUsers,
                   SUM(m.requestCount)      AS totalRequests,
                   SUM(m.totalTokens)       AS totalTokens
            FROM DailyMetrics m
            WHERE m.teamId = :teamId AND m.date >= :since
            GROUP BY m.teamId
            """)
    // Runs the query above with the given team and start date
    List<TeamAggregate> aggregateByTeam(@Param("teamId") String teamId, @Param("since") LocalDate since);
}
