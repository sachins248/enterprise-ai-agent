// This file belongs to the repository package (database access)
package com.enterprise.analytics.repository;

// The table class for pipeline runs
import com.enterprise.analytics.entity.PipelineEvent;
// This gives us ready-made save, find and delete methods
import org.springframework.data.jpa.repository.JpaRepository;
// Lets us write our own database query
import org.springframework.data.jpa.repository.Query;

// Used for lists
import java.util.List;
// We need this type for ids
import java.util.UUID;

// Database access for pipeline runs (the id type is UUID)
public interface PipelineEventRepository extends JpaRepository<PipelineEvent, UUID> {

    /** Last 10 pipeline runs for the recent-runs section. */
    // Get the 10 newest runs
    List<PipelineEvent> findTop10ByOrderByProcessedAtDesc();

    /** Per-repo run counts for the byRepo section. */
    // Our own query: count runs for each repository, biggest first
    @Query("SELECT p.repoName AS repoName, COUNT(p) AS runCount FROM PipelineEvent p GROUP BY p.repoName ORDER BY runCount DESC")
    List<RepoCount> countGroupedByRepo();

    // The shape of one row from the query above
    interface RepoCount {
        // The repository name
        String getRepoName();
        // How many times it ran
        Long getRunCount();
    }
}
