package com.enterprise.analytics.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Aggregated stats for one team over the last 30 days.
 *
 * Uses a regular class (not a record) so that GenericJackson2JsonRedisSerializer
 * can deserialize it from the Redis cache using the no-arg constructor.
 *
 * @JsonCreator + @JsonProperty are required because Jackson needs to know
 * which JSON fields map to which constructor parameters when deserializing.
 */
public class TeamSummaryResponse {

    private String teamId;
    private long totalUsers;
    private long totalRequests;
    private long totalTokens;

    // Required by Jackson for deserialization from Redis cache
    public TeamSummaryResponse() {}

    @JsonCreator
    public TeamSummaryResponse(
            @JsonProperty("teamId") String teamId,
            @JsonProperty("totalUsers") long totalUsers,
            @JsonProperty("totalRequests") long totalRequests,
            @JsonProperty("totalTokens") long totalTokens
    ) {
        this.teamId = teamId;
        this.totalUsers = totalUsers;
        this.totalRequests = totalRequests;
        this.totalTokens = totalTokens;
    }

    public String getTeamId() { return teamId; }
    public long getTotalUsers() { return totalUsers; }
    public long getTotalRequests() { return totalRequests; }
    public long getTotalTokens() { return totalTokens; }
}
