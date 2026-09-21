// This file belongs to the dto package (simple data holders)
package com.enterprise.gateway.dto;

// The new limits an admin wants: requests per hour and tokens per day
public record TeamLimitsRequest(int requestsPerHour, int tokensPerDay) {}
