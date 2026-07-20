package com.enterprise.analytics.service;

import com.enterprise.analytics.dto.PipelineMetricsResponse;
import com.enterprise.analytics.dto.TeamSummaryResponse;
import com.enterprise.analytics.dto.UsagePoint;
import com.enterprise.analytics.repository.DailyMetricsRepository;
import com.enterprise.analytics.repository.PipelineEventRepository;
import com.enterprise.analytics.repository.TeamAggregate;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class AnalyticsService {

    private final DailyMetricsRepository dailyMetricsRepository;
    private final PipelineEventRepository pipelineEventRepository;

    public AnalyticsService(
            DailyMetricsRepository dailyMetricsRepository,
            PipelineEventRepository pipelineEventRepository
    ) {
        this.dailyMetricsRepository = dailyMetricsRepository;
        this.pipelineEventRepository = pipelineEventRepository;
    }

    /**
     * Returns daily usage breakdown for a user over the last {@code days} days.
     * Not cached — these are per-user queries that change frequently.
     */
    public List<UsagePoint> getUsage(String userId, int days) {
        LocalDate from = LocalDate.now().minusDays(days - 1L);
        LocalDate to = LocalDate.now();

        return dailyMetricsRepository
                .findByUserIdAndDateBetweenOrderByDateAsc(userId, from, to)
                .stream()
                .map(m -> new UsagePoint(m.getDate(), m.getRequestCount(), m.getTotalTokens()))
                .toList();
    }

    /**
     * Returns aggregated stats for all teams over the last 30 days.
     *
     * @Cacheable — result is stored in Redis under "team-analytics::'all'" for 5 minutes
     * (TTL is configured in RedisConfig). On cache hit, the DB query is skipped entirely.
     *
     * Why cache this? GROUP BY aggregations on a large DailyMetrics table are expensive.
     * Admin dashboards typically tolerate a few minutes of staleness.
     */
    @Cacheable(value = "team-analytics", key = "'all'")
    public List<TeamSummaryResponse> getAllTeamsSummary() {
        LocalDate since = LocalDate.now().minusDays(30);
        List<TeamAggregate> rows = dailyMetricsRepository.aggregateAllTeams(since);

        return rows.stream()
                .map(r -> new TeamSummaryResponse(
                        r.getTeamId(),
                        r.getTotalUsers() != null ? r.getTotalUsers() : 0L,
                        r.getTotalRequests() != null ? r.getTotalRequests() : 0L,
                        r.getTotalTokens() != null ? r.getTotalTokens() : 0L
                ))
                .toList();
    }

    /**
     * Returns aggregated stats for a single team over the last 30 days.
     *
     * @Cacheable — cached under "team-analytics::<teamId>" for 5 minutes.
     * Different cache keys per team so each team's cache is independent.
     */
    @Cacheable(value = "team-analytics", key = "#teamId")
    public TeamSummaryResponse getTeamSummary(String teamId) {
        LocalDate since = LocalDate.now().minusDays(30);
        List<TeamAggregate> rows = dailyMetricsRepository.aggregateByTeam(teamId, since);

        if (rows.isEmpty()) {
            return new TeamSummaryResponse(teamId, 0L, 0L, 0L);
        }

        TeamAggregate r = rows.get(0);
        return new TeamSummaryResponse(
                r.getTeamId(),
                r.getTotalUsers() != null ? r.getTotalUsers() : 0L,
                r.getTotalRequests() != null ? r.getTotalRequests() : 0L,
                r.getTotalTokens() != null ? r.getTotalTokens() : 0L
        );
    }

    /**
     * Returns CI/CD pipeline analytics: total runs, per-repo stats, last 10 runs.
     * Not cached — pipeline data changes infrequently but real-time is more useful here.
     */
    public PipelineMetricsResponse getPipelineMetrics() {
        long totalRuns = pipelineEventRepository.count();

        List<PipelineMetricsResponse.RepoStats> byRepo = pipelineEventRepository
                .countGroupedByRepo()
                .stream()
                .map(r -> new PipelineMetricsResponse.RepoStats(r.getRepoName(), r.getRunCount()))
                .toList();

        List<PipelineMetricsResponse.RecentRun> recentRuns = pipelineEventRepository
                .findTop10ByOrderByProcessedAtDesc()
                .stream()
                .map(e -> new PipelineMetricsResponse.RecentRun(
                        e.getRepoName(), e.getProcessedAt(), e.getTokenCount()))
                .toList();

        return new PipelineMetricsResponse(totalRuns, byRepo, recentRuns);
    }
}
