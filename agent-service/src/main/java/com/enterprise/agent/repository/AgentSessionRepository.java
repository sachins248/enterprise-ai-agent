package com.enterprise.agent.repository;

import com.enterprise.agent.entity.AgentSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AgentSessionRepository extends JpaRepository<AgentSession, UUID> {
    List<AgentSession> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
