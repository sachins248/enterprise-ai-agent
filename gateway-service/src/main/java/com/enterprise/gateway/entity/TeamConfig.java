// This file belongs to the entity package (database tables)
package com.enterprise.gateway.entity;

// We need the JPA annotations that map this class to a table
import jakarta.persistence.*;

// Says this class is a database table
@Entity
// The table is called team_configs
@Table(name = "team_configs")
// One row = the limits for one team
public class TeamConfig {

    // This field is the primary key
    @Id
    // The team's id (each team has one row)
    private String teamId;

    // This column can't be empty
    @Column(nullable = false)
    // How many requests the team can make per hour
    private int requestsPerHour;

    // This column can't be empty
    @Column(nullable = false)
    // How many tokens the team can use per day
    private int tokensPerDay;

    // An empty constructor is required by JPA
    public TeamConfig() {}

    // A handy constructor so we can make a full row in one line
    public TeamConfig(String teamId, int requestsPerHour, int tokensPerDay) {
        // Save the team id
        this.teamId = teamId;
        // Save the hourly request limit
        this.requestsPerHour = requestsPerHour;
        // Save the daily token limit
        this.tokensPerDay = tokensPerDay;
    }

    // Read the team id
    public String getTeamId() { return teamId; }
    // Set the team id
    public void setTeamId(String teamId) { this.teamId = teamId; }

    // Read the hourly request limit
    public int getRequestsPerHour() { return requestsPerHour; }
    // Set the hourly request limit
    public void setRequestsPerHour(int requestsPerHour) { this.requestsPerHour = requestsPerHour; }

    // Read the daily token limit
    public int getTokensPerDay() { return tokensPerDay; }
    // Set the daily token limit
    public void setTokensPerDay(int tokensPerDay) { this.tokensPerDay = tokensPerDay; }
}
