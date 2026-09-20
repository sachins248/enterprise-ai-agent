package com.enterprise.gateway.service;

import com.enterprise.gateway.dto.TeamLimitsRequest;
import com.enterprise.gateway.entity.TeamConfig;
import com.enterprise.gateway.repository.TeamConfigRepository;
import org.springframework.stereotype.Service;

@Service
public class TeamConfigService {

    private static final int DEFAULT_REQUESTS_PER_HOUR = 100;
    private static final int DEFAULT_TOKENS_PER_DAY = 100_000;

    private final TeamConfigRepository teamConfigRepository;

    public TeamConfigService(TeamConfigRepository teamConfigRepository) {
        this.teamConfigRepository = teamConfigRepository;
    }

    public int getRequestsPerHour(String teamId) {
        return teamConfigRepository.findById(teamId)
                .map(TeamConfig::getRequestsPerHour)
                .orElse(DEFAULT_REQUESTS_PER_HOUR);
    }

    public TeamConfig updateLimits(String teamId, TeamLimitsRequest request) {
        TeamConfig config = teamConfigRepository.findById(teamId)
                .orElse(new TeamConfig(teamId, DEFAULT_REQUESTS_PER_HOUR, DEFAULT_TOKENS_PER_DAY));
        config.setRequestsPerHour(request.requestsPerHour());
        config.setTokensPerDay(request.tokensPerDay());
        return teamConfigRepository.save(config);
    }
}
