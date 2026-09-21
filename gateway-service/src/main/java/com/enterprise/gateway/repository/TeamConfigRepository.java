// This file belongs to the repository package (database access)
package com.enterprise.gateway.repository;

// The table class for team settings
import com.enterprise.gateway.entity.TeamConfig;
// This gives us ready-made save, find and delete methods
import org.springframework.data.jpa.repository.JpaRepository;

// Database access for team settings (the id type is String)
public interface TeamConfigRepository extends JpaRepository<TeamConfig, String> {}
