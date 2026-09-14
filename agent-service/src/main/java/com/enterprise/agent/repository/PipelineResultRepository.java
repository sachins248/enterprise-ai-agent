package com.enterprise.agent.repository;

import com.enterprise.agent.entity.PipelineResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PipelineResultRepository extends JpaRepository<PipelineResult, UUID> {
    Optional<PipelineResult> findTopByRepoNameOrderByCreatedAtDesc(String repoName);
    List<PipelineResult> findByRepoNameOrderByCreatedAtDesc(String repoName);
}
