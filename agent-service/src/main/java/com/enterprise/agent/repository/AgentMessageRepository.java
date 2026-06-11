package com.enterprise.agent.repository;

import com.enterprise.agent.entity.AgentMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AgentMessageRepository extends JpaRepository<AgentMessage, UUID> {
    List<AgentMessage> findBySessionIdOrderByCreatedAtAsc(UUID sessionId);
}
