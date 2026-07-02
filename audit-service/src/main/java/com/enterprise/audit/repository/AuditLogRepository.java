package com.enterprise.audit.repository;

import com.enterprise.audit.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    List<AuditLog> findAllByOrderByTimestampDesc();

    @Query("""
            SELECT COALESCE(SUM(a.tokenCount), 0) FROM AuditLog a
            WHERE a.userId = :userId
            """)
    long sumTokensByUserId(@Param("userId") String userId);

    long countByUserId(String userId);
}
