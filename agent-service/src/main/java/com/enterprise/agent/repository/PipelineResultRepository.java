// This file belongs to the repository package (database access)
package com.enterprise.agent.repository;

// The table class for pipeline results
import com.enterprise.agent.entity.PipelineResult;
// This gives us ready-made save, find and delete methods
import org.springframework.data.jpa.repository.JpaRepository;

// Used for lists
import java.util.List;
// Optional means "the result might be empty"
import java.util.Optional;
// We need this type for ids
import java.util.UUID;

// Database access for pipeline results (the id type is UUID)
public interface PipelineResultRepository extends JpaRepository<PipelineResult, UUID> {
    // Get the newest result for a repository (empty if there are none)
    Optional<PipelineResult> findTopByRepoNameOrderByCreatedAtDesc(String repoName);
    // Get all results for a repository, newest first
    List<PipelineResult> findByRepoNameOrderByCreatedAtDesc(String repoName);
}
