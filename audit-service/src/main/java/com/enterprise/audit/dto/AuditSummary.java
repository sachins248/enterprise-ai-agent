package com.enterprise.audit.dto;

public record AuditSummary(String userId, long totalRequests, long totalTokens) {}
