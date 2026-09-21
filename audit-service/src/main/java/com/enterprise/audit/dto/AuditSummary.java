// This file belongs to the dto package (simple data holders)
package com.enterprise.audit.dto;

// The totals for one user: how many requests and how many tokens they used
public record AuditSummary(String userId, long totalRequests, long totalTokens) {}
