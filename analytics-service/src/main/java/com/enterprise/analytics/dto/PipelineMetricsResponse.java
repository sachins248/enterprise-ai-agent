package com.enterprise.analytics.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Aggregated CI/CD pipeline analytics.
 * Returned by GET /analytics/pipeline (any authenticated user).
 */
public record PipelineMetricsResponse(
        long totalRuns,
        List<RepoStats> byRepo,
        List<RecentRun> recentRuns
) {
    /** Per-repository run count. */
    public record RepoStats(String repoName, long runCount) {}

    /** Last 10 pipeline runs (newest first). */
    public record RecentRun(String repoName, LocalDateTime processedAt, int tokenCount) {}
}
