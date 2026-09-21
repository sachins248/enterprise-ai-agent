// This file belongs to the controller package (web endpoints)
package com.enterprise.audit.controller;

// What we send back for a user summary
import com.enterprise.audit.dto.AuditSummary;
// The database class for one audit record
import com.enterprise.audit.entity.AuditLog;
// The service that does the real work
import com.enterprise.audit.service.AuditService;
// Lets us read dates from the URL
import org.springframework.format.annotation.DateTimeFormat;
// Lets us say "only this role can call this"
import org.springframework.security.access.prepost.PreAuthorize;
// Import the web annotations like @GetMapping
import org.springframework.web.bind.annotation.*;

// A type for date and time
import java.time.LocalDateTime;
// Used for lists
import java.util.List;

// Says this class answers web requests and returns JSON
@RestController
// All endpoints in this class start with /audit
@RequestMapping("/audit")
@PreAuthorize("hasRole('ADMIN')")  // all endpoints in this controller require ADMIN role
// This class lets admins look at the audit records
public class AuditController {

    // The service that does the real work
    private final AuditService auditService;

    // Spring gives us the service when it creates this class
    public AuditController(AuditService auditService) {
        // Save the service so the methods below can use it
        this.auditService = auditService;
    }

    /**
     * GET /audit/logs?userId=xxx&from=2024-01-01T00:00:00&to=2024-12-31T23:59:59
     * All params optional — omit any to skip that filter.
     */
    // Runs when someone sends GET /audit/logs
    @GetMapping("/logs")
    public List<AuditLog> getLogs(
            // Optional: only show records for this user
            @RequestParam(required = false) String userId,
            // Optional: only show records from this time on (read as an ISO date and time)
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            // Optional: only show records up to this time (read as an ISO date and time)
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        // Ask the service for the matching records
        return auditService.getLogs(userId, from, to);
    }

    /**
     * GET /audit/logs/{userId}/summary
     * Returns total token usage and request count for a specific user.
     */
    // Runs when someone sends GET /audit/logs/{userId}/summary
    @GetMapping("/logs/{userId}/summary")
    public AuditSummary getSummary(@PathVariable String userId) {
        // Ask the service for that user's totals
        return auditService.getSummary(userId);
    }
}
