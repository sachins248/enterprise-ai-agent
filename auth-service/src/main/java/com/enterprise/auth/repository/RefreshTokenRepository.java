// This file belongs to the repository package (database access)
package com.enterprise.auth.repository;

// We need the RefreshToken table class
import com.enterprise.auth.entity.RefreshToken;
// This gives us ready-made save, find and delete methods
import org.springframework.data.jpa.repository.JpaRepository;

// Optional means "the result might be empty"
import java.util.Optional;
// We need this type for ids
import java.util.UUID;

// Database access for refresh tokens (the id type is UUID)
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    // Find a refresh token row by its token text
    Optional<RefreshToken> findByToken(String token);
    // Delete all refresh tokens that belong to one user
    void deleteByUserId(UUID userId);
}
