// This file belongs to the dto package (simple data holders)
package com.enterprise.auth.dto;

// We need the Role type for the role field
import com.enterprise.auth.enums.Role;

// We need this type for the time the account was made
import java.time.LocalDateTime;
// We need this type for the user's id
import java.util.UUID;

// This is what we send back when someone asks "who am I?"
// It has no password on purpose, so we never leak it
public record UserResponse(
        // The user's unique id
        UUID id,
        // The user's email
        String email,
        // The user's role (ADMIN, DEVELOPER or VIEWER)
        Role role,
        // The team the user belongs to
        String teamId,
        // When the account was created
        LocalDateTime createdAt
) {}
