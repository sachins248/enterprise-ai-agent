// This file belongs to the dto package (simple data holders)
package com.enterprise.agent.dto;

// The data the user sends when they chat with the AI
public record ChatRequest(
        String sessionId,   // optional — null creates a new session
        // The id of the user who is chatting
        String userId,
        String codeContext, // optional — code snippet as context
        // What the user is asking
        String prompt
) {}
