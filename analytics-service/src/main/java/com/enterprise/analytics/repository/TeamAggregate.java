package com.enterprise.analytics.repository;

/**
 * Spring Data projection interface — maps the JPQL GROUP BY result
 * into a typed object without needing a manual Object[] cast.
 *
 * Spring generates a proxy at runtime that returns each getter's value
 * from the query result tuple. The alias names in the JPQL SELECT
 * must exactly match the getter names (minus "get", camelCase).
 */
public interface TeamAggregate {
    String getTeamId();
    Long getTotalUsers();
    Long getTotalRequests();
    Long getTotalTokens();
}
