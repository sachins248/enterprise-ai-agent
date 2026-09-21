// This file belongs to the service package (business logic)
package com.enterprise.audit.service;

// What we send back for a user summary
import com.enterprise.audit.dto.AuditSummary;
// The database class for one audit record
import com.enterprise.audit.entity.AuditLog;
// Database access for audit records
import com.enterprise.audit.repository.AuditLogRepository;
// Marks this class as a service
import org.springframework.stereotype.Service;

// A type for date and time
import java.time.LocalDateTime;
// Used for lists
import java.util.List;
// Helps us turn a stream back into a list
import java.util.stream.Collectors;

// Marks this class as a service so Spring can create it
@Service
// This class has the logic for reading audit records
public class AuditService {

    // Used to read audit records from the database
    private final AuditLogRepository auditLogRepository;

    // Spring gives us the repository when it creates this class
    public AuditService(AuditLogRepository auditLogRepository) {
        // Save the repository
        this.auditLogRepository = auditLogRepository;
    }

    // Get audit records, with optional filters for user and time
    public List<AuditLog> getLogs(String userId, LocalDateTime from, LocalDateTime to) {
        // Load all records, newest first, then filter them one by one
        return auditLogRepository.findAllByOrderByTimestampDesc().stream()
                // Keep the record if no user filter was given, or the user matches
                .filter(l -> userId == null || userId.equals(l.getUserId()))
                // Keep the record if no start time was given, or the record is not before it
                .filter(l -> from == null || !l.getTimestamp().isBefore(from))
                // Keep the record if no end time was given, or the record is not after it
                .filter(l -> to == null || !l.getTimestamp().isAfter(to))
                // Put the kept records back into a list
                .collect(Collectors.toList());
    }

    // Get the totals for one user
    public AuditSummary getSummary(String userId) {
        // Count how many requests the user made
        long totalRequests = auditLogRepository.countByUserId(userId);
        // Add up how many tokens the user used
        long totalTokens = auditLogRepository.sumTokensByUserId(userId);
        // Put both numbers in one response
        return new AuditSummary(userId, totalRequests, totalTokens);
    }
}
