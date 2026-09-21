// This file belongs to the repository package (database access)
package com.enterprise.agent.repository;

// The table class for messages
import com.enterprise.agent.entity.AgentMessage;
// This gives us ready-made save, find and delete methods
import org.springframework.data.jpa.repository.JpaRepository;

// Used for lists
import java.util.List;
// We need this type for ids
import java.util.UUID;

// Database access for messages (the id type is UUID)
public interface AgentMessageRepository extends JpaRepository<AgentMessage, UUID> {
    // Get all messages in a session, oldest first (so the chat reads in order)
    List<AgentMessage> findBySessionIdOrderByCreatedAtAsc(UUID sessionId);
}
