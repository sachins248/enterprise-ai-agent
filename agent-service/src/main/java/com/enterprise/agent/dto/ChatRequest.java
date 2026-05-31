package com.enterprise.agent.dto;

public record ChatRequest(
        String sessionId,   // optional — null creates a new session
        String userId,
        String codeContext, // optional — code snippet as context
        String prompt
) {}
