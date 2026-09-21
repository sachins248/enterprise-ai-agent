// This file belongs to the dto package (simple data holders)
package com.enterprise.auth.dto;

// This is what we send back after a successful login or register
public record AuthResponse(
        // The short-lived token the user sends with every request
        String accessToken,
        // The long-lived token used to get a new access token later
        String refreshToken,
        // The kind of token, always "Bearer"
        String tokenType,
        // How many seconds until the access token stops working
        long expiresIn
) {}
