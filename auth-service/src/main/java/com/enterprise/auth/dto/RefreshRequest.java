// This file belongs to the dto package (simple data holders)
package com.enterprise.auth.dto;

// This is the data the user sends to get a new access token: the refresh token
public record RefreshRequest(String refreshToken) {}
