package com.enterprise.analytics.controller;

import com.enterprise.analytics.dto.PipelineMetricsResponse;
import com.enterprise.analytics.dto.TeamSummaryResponse;
import com.enterprise.analytics.dto.UsagePoint;
import com.enterprise.analytics.service.AnalyticsService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /**
     * GET /analytics/usage?userId=abc123&days=7
     *
     * Returns daily usage breakdown for a user.
     * Any authenticated user can call this (typically a user viewing their own stats).
     * The gateway already validated the JWT before this request arrived.
     */
    @GetMapping("/usage")
    public List<UsagePoint> getUsage(
            @RequestParam String userId,
            @RequestParam(defaultValue = "7") int days
    ) {
        int clampedDays = Math.max(1, Math.min(days, 90));  // 1–90 days max
        return analyticsService.getUsage(userId, clampedDays);
    }

    /**
     * GET /analytics/teams
     *
     * Returns aggregated stats for ALL teams — ADMIN only.
     * @PreAuthorize checks the role embedded in the JWT.
     * If the user is not ADMIN, Spring Security throws AccessDeniedException → 403.
     */
    @GetMapping("/teams")
    @PreAuthorize("hasRole('ADMIN')")
    public List<TeamSummaryResponse> getAllTeams() {
        return analyticsService.getAllTeamsSummary();
    }

    /**
     * GET /analytics/teams/{teamId}
     *
     * Returns aggregated stats for a specific team — ADMIN only.
     */
    @GetMapping("/teams/{teamId}")
    @PreAuthorize("hasRole('ADMIN')")
    public TeamSummaryResponse getTeam(@PathVariable String teamId) {
        return analyticsService.getTeamSummary(teamId);
    }

    /**
     * GET /analytics/pipeline
     *
     * Returns CI/CD pipeline run history and per-repo stats.
     * Available to any authenticated user (developers want to see build analytics).
     */
    @GetMapping("/pipeline")
    public PipelineMetricsResponse getPipeline() {
        return analyticsService.getPipelineMetrics();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public Map<String, String> handleBadRequest(IllegalArgumentException e) {
        return Map.of("error", e.getMessage());
    }
}
