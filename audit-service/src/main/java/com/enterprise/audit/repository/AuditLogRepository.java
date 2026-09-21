// This file belongs to the repository package (database access)
package com.enterprise.audit.repository;

// The table class for audit records
import com.enterprise.audit.entity.AuditLog;
// This gives us ready-made save, find and delete methods
import org.springframework.data.jpa.repository.JpaRepository;
// Lets us write our own database query
import org.springframework.data.jpa.repository.Query;
// Lets us pass a value into a query
import org.springframework.data.repository.query.Param;

// Used for lists
import java.util.List;
// We need this type for ids
import java.util.UUID;

// Database access for audit records (the id type is UUID)
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    // Get all records, newest first
    List<AuditLog> findAllByOrderByTimestampDesc();

    // Our own query: add up all tokens for one user (COALESCE turns "nothing" into 0)
    @Query("""
            SELECT COALESCE(SUM(a.tokenCount), 0) FROM AuditLog a
            WHERE a.userId = :userId
            """)
    // Runs the query above with the given user id
    long sumTokensByUserId(@Param("userId") String userId);

    // Count how many records one user has
    long countByUserId(String userId);
}
