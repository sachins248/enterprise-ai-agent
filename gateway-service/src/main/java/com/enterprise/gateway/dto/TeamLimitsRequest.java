package com.enterprise.gateway.dto;

public record TeamLimitsRequest(int requestsPerHour, int tokensPerDay) {}
