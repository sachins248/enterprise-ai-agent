package com.enterprise.auth.dto;

import com.enterprise.auth.enums.Role;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        Role role,
        String teamId,
        LocalDateTime createdAt
) {}
