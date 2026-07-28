package com.enterprise.analytics.dto;

import java.time.LocalDate;

/**
 * One data point in a user's usage timeline.
 * Returned by GET /analytics/usage?userId=&days=7
 */
public record UsagePoint(
        LocalDate date,
        int requestCount,
        int totalTokens
) {}
