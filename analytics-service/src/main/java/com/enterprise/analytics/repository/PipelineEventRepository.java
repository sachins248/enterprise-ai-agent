package com.enterprise.analytics.repository;

import com.enterprise.analytics.entity.PipelineEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface PipelineEventRepository extends JpaRepository<PipelineEvent, UUID> {

    /** Last 10 pipeline runs for the recent-runs section. */
    List<PipelineEvent> findTop10ByOrderByProcessedAtDesc();

    /** Per-repo run counts for the byRepo section. */
    @Query("SELECT p.repoName AS repoName, COUNT(p) AS runCount FROM PipelineEvent p GROUP BY p.repoName ORDER BY runCount DESC")
    List<RepoCount> countGroupedByRepo();

    interface RepoCount {
        String getRepoName();
        Long getRunCount();
    }
}
