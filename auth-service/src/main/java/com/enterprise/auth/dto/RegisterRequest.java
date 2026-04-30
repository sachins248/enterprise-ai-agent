package com.enterprise.auth.dto;

import com.enterprise.auth.enums.Role;

public record RegisterRequest(String email, String password, Role role, String teamId) {}
