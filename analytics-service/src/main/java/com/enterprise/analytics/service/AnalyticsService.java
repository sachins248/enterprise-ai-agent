// This file belongs to the service package (business logic)
package com.enterprise.analytics.service;

// What we send back for pipeline stats
import com.enterprise.analytics.dto.PipelineMetricsResponse;
// What we send back for team stats
import com.enterprise.analytics.dto.TeamSummaryResponse;
// One day of usage for a user
import com.enterprise.analytics.dto.UsagePoint;
// Database access for daily totals
import com.enterprise.analytics.repository.DailyMetricsRepository;
// Database access for pipeline runs
import com.enterprise.analytics.repository.PipelineEventRepository;
// The shape of one row of team totals
import com.enterprise.analytics.repository.TeamAggregate;
// Saves a method's result in the cache
import org.springframework.cache.annotation.Cacheable;
// Marks this class as a service
import org.springframework.stereotype.Service;

// A type for a date (no time)
import java.time.LocalDate;
// Used for lists
import java.util.List;

// Marks this class as a service so Spring can create it
@Service
// This class builds the usage, team and pipeline reports
public class AnalyticsService {

    // Used to read daily totals
    private final DailyMetricsRepository dailyMetricsRepository;
    // Used to read pipeline runs
    private final PipelineEventRepository pipelineEventRepository;

    // Spring gives us both repositories when it creates this class
    public AnalyticsService(
            // For daily totals
            DailyMetricsRepository dailyMetricsRepository,
            // For pipeline runs
            PipelineEventRepository pipelineEventRepository
    ) {
        // Save the daily totals repository
        this.dailyMetricsRepository = dailyMetricsRepository;
        // Save the pipeline runs repository
        this.pipelineEventRepository = pipelineEventRepository;
    }

    /**
     * Returns daily usage breakdown for a user over the last {@code days} days.
     * Not cached — these are per-user queries that change frequently.
     */
    // Get one user's usage for each of the last few days
    public List<UsagePoint> getUsage(String userId, int days) {
        // The first day of the range (today counts as day 1)
        LocalDate from = LocalDate.now().minusDays(days - 1L);
        // The last day of the range is today
        LocalDate to = LocalDate.now();

        // Load the rows for that range
        return dailyMetricsRepository
                .findByUserIdAndDateBetweenOrderByDateAsc(userId, from, to)
                // Go through them one by one
                .stream()
                // Turn each row into a simple data point
                .map(m -> new UsagePoint(m.getDate(), m.getRequestCount(), m.getTotalTokens()))
                // Put the points into a list
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
    // Save the result in Redis for 5 minutes so we don't ask the database every time
    @Cacheable(value = "team-analytics", key = "'all'")
    public List<TeamSummaryResponse> getAllTeamsSummary() {
        // Look at the last 30 days
        LocalDate since = LocalDate.now().minusDays(30);
        // Ask the database for the totals of each team
        List<TeamAggregate> rows = dailyMetricsRepository.aggregateAllTeams(since);

        // Turn each row into a response
        return rows.stream()
                .map(r -> new TeamSummaryResponse(
                        // The team id
                        r.getTeamId(),
                        // The user count (use 0 if the database gave nothing)
                        r.getTotalUsers() != null ? r.getTotalUsers() : 0L,
                        // The request count (use 0 if the database gave nothing)
                        r.getTotalRequests() != null ? r.getTotalRequests() : 0L,
                        // The token count (use 0 if the database gave nothing)
                        r.getTotalTokens() != null ? r.getTotalTokens() : 0L
                ))
                // Put the responses into a list
                .toList();
    }

    /**
     * Returns aggregated stats for a single team over the last 30 days.
     *
     * @Cacheable — cached under "team-analytics::<teamId>" for 5 minutes.
     * Different cache keys per team so each team's cache is independent.
     */
    // Save the result in Redis for 5 minutes, with one entry for each team
    @Cacheable(value = "team-analytics", key = "#teamId")
    public TeamSummaryResponse getTeamSummary(String teamId) {
        // Look at the last 30 days
        LocalDate since = LocalDate.now().minusDays(30);
        // Ask the database for this team's totals
        List<TeamAggregate> rows = dailyMetricsRepository.aggregateByTeam(teamId, since);

        // If the team has no data, return all zeros
        if (rows.isEmpty()) {
            // Zero users, zero requests, zero tokens
            return new TeamSummaryResponse(teamId, 0L, 0L, 0L);
        }

        // There is at most one row, so take the first
        TeamAggregate r = rows.get(0);
        // Turn the row into a response
        return new TeamSummaryResponse(
                // The team id
                r.getTeamId(),
                // The user count (use 0 if the database gave nothing)
                r.getTotalUsers() != null ? r.getTotalUsers() : 0L,
                // The request count (use 0 if the database gave nothing)
                r.getTotalRequests() != null ? r.getTotalRequests() : 0L,
                // The token count (use 0 if the database gave nothing)
                r.getTotalTokens() != null ? r.getTotalTokens() : 0L
        );
    }

    /**
     * Returns CI/CD pipeline analytics: total runs, per-repo stats, last 10 runs.
     * Not cached — pipeline data changes infrequently but real-time is more useful here.
     */
    // Get the pipeline numbers
    public PipelineMetricsResponse getPipelineMetrics() {
        // Count every pipeline run
        long totalRuns = pipelineEventRepository.count();

        // Get the run count for each repository
        List<PipelineMetricsResponse.RepoStats> byRepo = pipelineEventRepository
                .countGroupedByRepo()
                // Go through them one by one
                .stream()
                // Turn each row into a simple stats object
                .map(r -> new PipelineMetricsResponse.RepoStats(r.getRepoName(), r.getRunCount()))
                // Put them into a list
                .toList();

        // Get the 10 newest runs
        List<PipelineMetricsResponse.RecentRun> recentRuns = pipelineEventRepository
                .findTop10ByOrderByProcessedAtDesc()
                // Go through them one by one
                .stream()
                // Turn each row into a simple run object
                .map(e -> new PipelineMetricsResponse.RecentRun(
                        e.getRepoName(), e.getProcessedAt(), e.getTokenCount()))
                // Put them into a list
                .toList();

        // Put all three parts into one response
        return new PipelineMetricsResponse(totalRuns, byRepo, recentRuns);
    }
}
