package com.enterprise.analytics.repository;

import com.enterprise.analytics.entity.DailyMetrics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DailyMetricsRepository extends JpaRepository<DailyMetrics, UUID> {

    /** Used by the Kafka consumer to upsert today's row. */
    Optional<DailyMetrics> findByUserIdAndDate(String userId, LocalDate date);

    /** Used by GET /analytics/usage — last N days for a specific user. */
    List<DailyMetrics> findByUserIdAndDateBetweenOrderByDateAsc(
            String userId, LocalDate from, LocalDate to);

    /**
     * Aggregates all teams over the last 30 days.
     *
     * The aliases (teamId, totalUsers, etc.) must exactly match the
     * getter names in TeamAggregate (minus "get", camelCase).
     * Spring Data generates a proxy that implements the interface.
     */
    @Query("""
            SELECT m.teamId  AS teamId,
                   COUNT(DISTINCT m.userId) AS totalUsers,
                   SUM(m.requestCount)      AS totalRequests,
                   SUM(m.totalTokens)       AS totalTokens
            FROM DailyMetrics m
            WHERE m.date >= :since
            GROUP BY m.teamId
            """)
    List<TeamAggregate> aggregateAllTeams(@Param("since") LocalDate since);

    /**
     * Same aggregation filtered to one specific team.
     * Returns a list because the projection interface requires it,
     * but there will only ever be 0 or 1 result.
     */
    @Query("""
            SELECT m.teamId  AS teamId,
                   COUNT(DISTINCT m.userId) AS totalUsers,
                   SUM(m.requestCount)      AS totalRequests,
                   SUM(m.totalTokens)       AS totalTokens
            FROM DailyMetrics m
            WHERE m.teamId = :teamId AND m.date >= :since
            GROUP BY m.teamId
            """)
    List<TeamAggregate> aggregateByTeam(@Param("teamId") String teamId, @Param("since") LocalDate since);
}
