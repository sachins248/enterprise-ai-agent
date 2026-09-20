package com.enterprise.gateway.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "team_configs")
public class TeamConfig {

    @Id
    private String teamId;

    @Column(nullable = false)
    private int requestsPerHour;

    @Column(nullable = false)
    private int tokensPerDay;

    public TeamConfig() {}

    public TeamConfig(String teamId, int requestsPerHour, int tokensPerDay) {
        this.teamId = teamId;
        this.requestsPerHour = requestsPerHour;
        this.tokensPerDay = tokensPerDay;
    }

    public String getTeamId() { return teamId; }
    public void setTeamId(String teamId) { this.teamId = teamId; }

    public int getRequestsPerHour() { return requestsPerHour; }
    public void setRequestsPerHour(int requestsPerHour) { this.requestsPerHour = requestsPerHour; }

    public int getTokensPerDay() { return tokensPerDay; }
    public void setTokensPerDay(int tokensPerDay) { this.tokensPerDay = tokensPerDay; }
}
