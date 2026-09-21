// This file belongs to the repository package (database access)
package com.enterprise.analytics.repository;

/**
 * Spring Data projection interface — maps the JPQL GROUP BY result
 * into a typed object without needing a manual Object[] cast.
 *
 * Spring generates a proxy at runtime that returns each getter's value
 * from the query result tuple. The alias names in the JPQL SELECT
 * must exactly match the getter names (minus "get", camelCase).
 */
// The shape of one row of team totals from our query
public interface TeamAggregate {
    // The team's id
    String getTeamId();
    // How many different users
    Long getTotalUsers();
    // How many requests
    Long getTotalRequests();
    // How many tokens
    Long getTotalTokens();
}
