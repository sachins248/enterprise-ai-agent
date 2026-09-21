// This file belongs to the repository package (database access)
package com.enterprise.agent.repository;

// The table class for sessions
import com.enterprise.agent.entity.AgentSession;
// This gives us ready-made save, find and delete methods
import org.springframework.data.jpa.repository.JpaRepository;

// Used for lists
import java.util.List;
// We need this type for ids
import java.util.UUID;

// Database access for sessions (the id type is UUID)
public interface AgentSessionRepository extends JpaRepository<AgentSession, UUID> {
    // Get all sessions for a user, newest first (so recent chats show at the top)
    List<AgentSession> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
