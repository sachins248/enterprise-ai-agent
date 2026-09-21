// This file belongs to the repository package (database access)
package com.enterprise.auth.repository;

// We need the User table class
import com.enterprise.auth.entity.User;
// This gives us ready-made save, find and delete methods
import org.springframework.data.jpa.repository.JpaRepository;

// Optional means "the result might be empty"
import java.util.Optional;
// We need this type for ids
import java.util.UUID;

// Database access for users (the id type is UUID)
public interface UserRepository extends JpaRepository<User, UUID> {
    // Find a user by email (used for login)
    Optional<User> findByEmail(String email);
    // Check if an email is already taken (used for register)
    boolean existsByEmail(String email);
}
