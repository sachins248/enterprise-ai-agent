// This file belongs to the dto package (simple data holders)
package com.enterprise.auth.dto;

// We need the Role type for the role field
import com.enterprise.auth.enums.Role;

// This is the data the user sends to create an account
// The role and team are optional (the service picks a default role)
public record RegisterRequest(String email, String password, Role role, String teamId) {}
