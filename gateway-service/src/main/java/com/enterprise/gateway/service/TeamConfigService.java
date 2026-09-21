// This file belongs to the service package (business logic)
package com.enterprise.gateway.service;

// The data an admin sends to change limits
import com.enterprise.gateway.dto.TeamLimitsRequest;
// The database table class for team settings
import com.enterprise.gateway.entity.TeamConfig;
// Database access for team settings
import com.enterprise.gateway.repository.TeamConfigRepository;
// Marks this class as a service
import org.springframework.stereotype.Service;

// Marks this class as a service so Spring can create it
@Service
// This class reads and changes the limits for each team
public class TeamConfigService {

    // The limit for teams that have no settings yet: 100 requests per hour
    private static final int DEFAULT_REQUESTS_PER_HOUR = 100;
    // The limit for teams that have no settings yet: 100,000 tokens per day
    private static final int DEFAULT_TOKENS_PER_DAY = 100_000;

    // Used to read and save team settings
    private final TeamConfigRepository teamConfigRepository;

    // Spring gives us the repository when it creates this class
    public TeamConfigService(TeamConfigRepository teamConfigRepository) {
        // Save the repository
        this.teamConfigRepository = teamConfigRepository;
    }

    // Get how many requests per hour a team is allowed
    public int getRequestsPerHour(String teamId) {
        // Look for the team's row
        return teamConfigRepository.findById(teamId)
                // If found, use its limit
                .map(TeamConfig::getRequestsPerHour)
                // If not found, use the default
                .orElse(DEFAULT_REQUESTS_PER_HOUR);
    }

    // Change the limits for a team
    public TeamConfig updateLimits(String teamId, TeamLimitsRequest request) {
        // Find the team's row, or start a new one with default values
        TeamConfig config = teamConfigRepository.findById(teamId)
                .orElse(new TeamConfig(teamId, DEFAULT_REQUESTS_PER_HOUR, DEFAULT_TOKENS_PER_DAY));
        // Set the new hourly request limit
        config.setRequestsPerHour(request.requestsPerHour());
        // Set the new daily token limit
        config.setTokensPerDay(request.tokensPerDay());
        // Save it and return the saved row
        return teamConfigRepository.save(config);
    }
}
