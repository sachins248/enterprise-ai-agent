package com.enterprise.audit.controller;

import com.enterprise.audit.dto.AuditSummary;
import com.enterprise.audit.entity.AuditLog;
import com.enterprise.audit.service.AuditService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/audit")
@PreAuthorize("hasRole('ADMIN')")  // all endpoints in this controller require ADMIN role
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    /**
     * GET /audit/logs?userId=xxx&from=2024-01-01T00:00:00&to=2024-12-31T23:59:59
     * All params optional — omit any to skip that filter.
     */
    @GetMapping("/logs")
    public List<AuditLog> getLogs(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        return auditService.getLogs(userId, from, to);
    }

    /**
     * GET /audit/logs/{userId}/summary
     * Returns total token usage and request count for a specific user.
     */
    @GetMapping("/logs/{userId}/summary")
    public AuditSummary getSummary(@PathVariable String userId) {
        return auditService.getSummary(userId);
    }
}
