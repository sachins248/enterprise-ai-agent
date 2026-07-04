package com.enterprise.audit.service;

import com.enterprise.audit.dto.AuditSummary;
import com.enterprise.audit.entity.AuditLog;
import com.enterprise.audit.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public List<AuditLog> getLogs(String userId, LocalDateTime from, LocalDateTime to) {
        return auditLogRepository.findAllByOrderByTimestampDesc().stream()
                .filter(l -> userId == null || userId.equals(l.getUserId()))
                .filter(l -> from == null || !l.getTimestamp().isBefore(from))
                .filter(l -> to == null || !l.getTimestamp().isAfter(to))
                .collect(Collectors.toList());
    }

    public AuditSummary getSummary(String userId) {
        long totalRequests = auditLogRepository.countByUserId(userId);
        long totalTokens = auditLogRepository.sumTokensByUserId(userId);
        return new AuditSummary(userId, totalRequests, totalTokens);
    }
}
