// This file belongs to the dto package (simple data holders)
package com.enterprise.analytics.dto;

// Tells Jackson which constructor to use when reading JSON
import com.fasterxml.jackson.annotation.JsonCreator;
// Tells Jackson which JSON field goes to which constructor value
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
// The totals for one team
public class TeamSummaryResponse {

    // The team's id
    private String teamId;
    // How many different users the team has
    private long totalUsers;
    // How many requests the team made
    private long totalRequests;
    // How many tokens the team used
    private long totalTokens;

    // Required by Jackson for deserialization from Redis cache
    public TeamSummaryResponse() {}

    // Tells Jackson to use this constructor when it reads JSON
    @JsonCreator
    public TeamSummaryResponse(
            // The JSON field "teamId" goes here
            @JsonProperty("teamId") String teamId,
            // The JSON field "totalUsers" goes here
            @JsonProperty("totalUsers") long totalUsers,
            // The JSON field "totalRequests" goes here
            @JsonProperty("totalRequests") long totalRequests,
            // The JSON field "totalTokens" goes here
            @JsonProperty("totalTokens") long totalTokens
    ) {
        // Save the team id
        this.teamId = teamId;
        // Save the user count
        this.totalUsers = totalUsers;
        // Save the request count
        this.totalRequests = totalRequests;
        // Save the token count
        this.totalTokens = totalTokens;
    }

    // Read the team id
    public String getTeamId() { return teamId; }
    // Read the user count
    public long getTotalUsers() { return totalUsers; }
    // Read the request count
    public long getTotalRequests() { return totalRequests; }
    // Read the token count
    public long getTotalTokens() { return totalTokens; }
}
