// This file belongs to the dto package (simple data holders)
package com.enterprise.analytics.dto;

// A type for a date (no time)
import java.time.LocalDate;

/**
 * One data point in a user's usage timeline.
 * Returned by GET /analytics/usage?userId=&days=7
 */
public record UsagePoint(
        // The day
        LocalDate date,
        // How many requests the user made that day
        int requestCount,
        // How many tokens the user used that day
        int totalTokens
) {}
