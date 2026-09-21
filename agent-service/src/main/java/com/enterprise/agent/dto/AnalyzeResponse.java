// This file belongs to the dto package (simple data holders)
package com.enterprise.agent.dto;

// What we send back after analyzing code: the analysis text and the language
public record AnalyzeResponse(String analysis, String language) {}
