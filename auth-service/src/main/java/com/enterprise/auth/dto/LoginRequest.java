// This file belongs to the dto package (simple data holders)
package com.enterprise.auth.dto;

// This is the data the user sends to log in: their email and password
public record LoginRequest(String email, String password) {}
