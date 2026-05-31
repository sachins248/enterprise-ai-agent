package com.enterprise.agent.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class GeminiService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.base-url}")
    private String baseUrl;

    @Value("${gemini.api.model}")
    private String model;

    public GeminiService(WebClient webClient, ObjectMapper objectMapper) {
        this.webClient = webClient;
        this.objectMapper = objectMapper;
    }

    /**
     * Streams a response from Gemini using Server-Sent Events.
     * Returns a Flux of text chunks as they arrive.
     */
    public Flux<String> streamChat(String prompt) {
        String url = baseUrl + "/v1beta/models/" + model + ":streamGenerateContent?alt=sse&key=" + apiKey;
        String requestBody = buildRequestBody(prompt);

        return webClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<ServerSentEvent<String>>() {})
                .mapNotNull(ServerSentEvent::data)
                .filter(data -> !data.equals("[DONE]"))
                .mapNotNull(this::extractTextFromChunk)
                .filter(text -> !text.isEmpty())
                .onErrorResume(e -> {
                    String msg = e.getMessage() != null ? e.getMessage() : "Gemini API error";
                    return Flux.just("[Error: " + msg.replaceAll("\"", "'") + "]");
                });
    }

    /**
     * Calls Gemini and waits for the full response (no streaming).
     * Used for /analyze and webhook endpoints.
     */
    public Mono<String> generateContent(String prompt) {
        String url = baseUrl + "/v1beta/models/" + model + ":generateContent?key=" + apiKey;
        String requestBody = buildRequestBody(prompt);

        return webClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .mapNotNull(this::extractTextFromFullResponse)
                .onErrorReturn("Analysis unavailable — Gemini API error");
    }

    // Builds the JSON request body Gemini expects
    private String buildRequestBody(String prompt) {
        try {
            ObjectNode root = objectMapper.createObjectNode();
            ArrayNode contents = objectMapper.createArrayNode();

            ObjectNode userMessage = objectMapper.createObjectNode();
            userMessage.put("role", "user");
            ArrayNode parts = objectMapper.createArrayNode();
            ObjectNode part = objectMapper.createObjectNode();
            part.put("text", prompt);
            parts.add(part);
            userMessage.set("parts", parts);
            contents.add(userMessage);

            root.set("contents", contents);

            ObjectNode generationConfig = objectMapper.createObjectNode();
            generationConfig.put("maxOutputTokens", 2048);
            generationConfig.put("temperature", 0.7);
            root.set("generationConfig", generationConfig);

            return objectMapper.writeValueAsString(root);
        } catch (Exception e) {
            throw new RuntimeException("Failed to build Gemini request", e);
        }
    }

    // Parses one SSE data chunk: {"candidates":[{"content":{"parts":[{"text":"..."}]}}]}
    private String extractTextFromChunk(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    return parts.get(0).path("text").asText("");
                }
            }
            return "";
        } catch (Exception e) {
            return "";
        }
    }

    // Parses the full non-streaming response body
    private String extractTextFromFullResponse(String json) {
        return extractTextFromChunk(json);  // same structure, just one object not SSE
    }

    // Rough token count estimate (Gemini counts ~4 chars per token)
    public int estimateTokenCount(String text) {
        return Math.max(1, text.length() / 4);
    }
}
