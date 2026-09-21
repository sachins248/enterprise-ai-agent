// This file belongs to the controller package (web endpoints)
package com.enterprise.analytics.controller;

// What we send back for pipeline stats
import com.enterprise.analytics.dto.PipelineMetricsResponse;
// What we send back for team stats
import com.enterprise.analytics.dto.TeamSummaryResponse;
// One day of usage for a user
import com.enterprise.analytics.dto.UsagePoint;
// The service that does the real work
import com.enterprise.analytics.service.AnalyticsService;
// Lets us say "only this role can call this"
import org.springframework.security.access.prepost.PreAuthorize;
// Import the web annotations like @GetMapping
import org.springframework.web.bind.annotation.*;

// Used for lists
import java.util.List;
// Used to build a small JSON error
import java.util.Map;

// Says this class answers web requests and returns JSON
@RestController
// All endpoints in this class start with /analytics
@RequestMapping("/analytics")
// This class has the endpoints for usage, team and pipeline reports
public class AnalyticsController {

    // The service that does the real work
    private final AnalyticsService analyticsService;

    // Spring gives us the service when it creates this class
    public AnalyticsController(AnalyticsService analyticsService) {
        // Save the service so the methods below can use it
        this.analyticsService = analyticsService;
    }

    /**
     * GET /analytics/usage?userId=abc123&days=7
     *
     * Returns daily usage breakdown for a user.
     * Any authenticated user can call this (typically a user viewing their own stats).
     * The gateway already validated the JWT before this request arrived.
     */
    // Runs when someone sends GET /analytics/usage
    @GetMapping("/usage")
    public List<UsagePoint> getUsage(
            // Which user we want stats for
            @RequestParam String userId,
            // How many days back to look (7 if not given)
            @RequestParam(defaultValue = "7") int days
    ) {
        // Keep the number between 1 and 90 so nobody asks for a huge range
        int clampedDays = Math.max(1, Math.min(days, 90));  // 1–90 days max
        // Ask the service for the daily numbers
        return analyticsService.getUsage(userId, clampedDays);
    }

    /**
     * GET /analytics/teams
     *
     * Returns aggregated stats for ALL teams — ADMIN only.
     * @PreAuthorize checks the role embedded in the JWT.
     * If the user is not ADMIN, Spring Security throws AccessDeniedException → 403.
     */
    // Runs when someone sends GET /analytics/teams
    @GetMapping("/teams")
    // Only admins can call this
    @PreAuthorize("hasRole('ADMIN')")
    public List<TeamSummaryResponse> getAllTeams() {
        // Ask the service for stats for every team
        return analyticsService.getAllTeamsSummary();
    }

    /**
     * GET /analytics/teams/{teamId}
     *
     * Returns aggregated stats for a specific team — ADMIN only.
     */
    // Runs when someone sends GET /analytics/teams/{teamId}
    @GetMapping("/teams/{teamId}")
    // Only admins can call this
    @PreAuthorize("hasRole('ADMIN')")
    public TeamSummaryResponse getTeam(@PathVariable String teamId) {
        // Ask the service for stats for that one team
        return analyticsService.getTeamSummary(teamId);
    }

    /**
     * GET /analytics/pipeline
     *
     * Returns CI/CD pipeline run history and per-repo stats.
     * Available to any authenticated user (developers want to see build analytics).
     */
    // Runs when someone sends GET /analytics/pipeline
    @GetMapping("/pipeline")
    public PipelineMetricsResponse getPipeline() {
        // Ask the service for the pipeline numbers
        return analyticsService.getPipelineMetrics();
    }

    // Runs when any method above throws IllegalArgumentException
    @ExceptionHandler(IllegalArgumentException.class)
    public Map<String, String> handleBadRequest(IllegalArgumentException e) {
        // Send the error message back as JSON
        return Map.of("error", e.getMessage());
    }
}
