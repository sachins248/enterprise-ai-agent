// This file belongs to the dto package (simple data holders)
package com.enterprise.analytics.dto;

// A type for date and time
import java.time.LocalDateTime;
// Used for lists
import java.util.List;

/**
 * Aggregated CI/CD pipeline analytics.
 * Returned by GET /analytics/pipeline (any authenticated user).
 */
public record PipelineMetricsResponse(
        // How many pipeline runs there have been in total
        long totalRuns,
        // The number of runs for each repository
        List<RepoStats> byRepo,
        // The latest runs
        List<RecentRun> recentRuns
) {
    /** Per-repository run count. */
    // A repository name and how many times it ran
    public record RepoStats(String repoName, long runCount) {}

    /** Last 10 pipeline runs (newest first). */
    // One run: the repository, when it ran and how many tokens it used
    public record RecentRun(String repoName, LocalDateTime processedAt, int tokenCount) {}
}
