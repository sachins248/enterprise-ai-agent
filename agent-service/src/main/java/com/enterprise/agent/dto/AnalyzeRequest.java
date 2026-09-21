// This file belongs to the dto package (simple data holders)
package com.enterprise.agent.dto;

// The data the user sends to get code analyzed: the code and its language
public record AnalyzeRequest(String code, String language) {}
