// This file belongs to the service package (business logic)
package com.enterprise.agent.service;

// One piece of JSON data
import com.fasterxml.jackson.databind.JsonNode;
// Reads and writes JSON
import com.fasterxml.jackson.databind.ObjectMapper;
// A JSON list
import com.fasterxml.jackson.databind.node.ArrayNode;
// A JSON object
import com.fasterxml.jackson.databind.node.ObjectNode;
// Lets us read values from application.properties
import org.springframework.beans.factory.annotation.Value;
// Helps Spring know the exact generic type we want
import org.springframework.core.ParameterizedTypeReference;
// Lets us say what type of data we send (like JSON)
import org.springframework.http.MediaType;
// One message in a Server-Sent Events stream
import org.springframework.http.codec.ServerSentEvent;
// Marks this class as a service
import org.springframework.stereotype.Service;
// The tool we use to call other web services without blocking
import org.springframework.web.reactive.function.client.WebClient;
// Flux means "many results that arrive over time" (used in reactive code)
import reactor.core.publisher.Flux;
// Mono means "one result that arrives later" (used in reactive code)
import reactor.core.publisher.Mono;

// Marks this class as a service so Spring can create it
@Service
// This class talks to Google's Gemini AI
public class GeminiService {

    // Used to send web requests to Gemini
    private final WebClient webClient;
    // Used to read and write JSON
    private final ObjectMapper objectMapper;

    // Read the API key from application.properties (so it is not in the code)
    @Value("${gemini.api.key}")
    // The secret key that lets us use Gemini
    private String apiKey;

    // Read the base URL from application.properties
    @Value("${gemini.api.base-url}")
    // The web address of the Gemini API
    private String baseUrl;

    // Read the model name from application.properties
    @Value("${gemini.api.model}")
    // Which Gemini model to use
    private String model;

    // Spring gives us both helpers when it creates this class
    public GeminiService(WebClient webClient, ObjectMapper objectMapper) {
        // Save the web client
        this.webClient = webClient;
        // Save the JSON tool
        this.objectMapper = objectMapper;
    }

    /**
     * Streams a response from Gemini using Server-Sent Events.
     * Returns a Flux of text chunks as they arrive.
     */
    // Sends a question to Gemini and gives back the answer piece by piece
    public Flux<String> streamChat(String prompt) {
        // Build the streaming URL (alt=sse asks Gemini to stream events)
        String url = baseUrl + "/v1beta/models/" + model + ":streamGenerateContent?alt=sse&key=" + apiKey;
        // Build the JSON body that Gemini expects
        String requestBody = buildRequestBody(prompt);

        // Start a POST request
        return webClient.post()
                // Send it to the streaming URL
                .uri(url)
                // Say we are sending JSON
                .contentType(MediaType.APPLICATION_JSON)
                // Attach the JSON body
                .bodyValue(requestBody)
                // Send it and get the response
                .retrieve()
                // Read the response as a stream of events (not raw text, because Spring removes the "data:" part for us)
                .bodyToFlux(new ParameterizedTypeReference<ServerSentEvent<String>>() {})
                // Take the data from each event and skip events with no data
                .mapNotNull(ServerSentEvent::data)
                // Skip the special "[DONE]" marker
                .filter(data -> !data.equals("[DONE]"))
                // Pull the answer text out of each event's JSON
                .mapNotNull(this::extractTextFromChunk)
                // Skip pieces that have no text
                .filter(text -> !text.isEmpty())
                // If something goes wrong, show an error message instead of crashing the stream
                .onErrorResume(e -> {
                    // Use the error message, or a default one if there is none
                    String msg = e.getMessage() != null ? e.getMessage() : "Gemini API error";
                    // Replace double quotes so the message is safe to show
                    return Flux.just("[Error: " + msg.replaceAll("\"", "'") + "]");
                });
    }

    /**
     * Calls Gemini and waits for the full response (no streaming).
     * Used for /analyze and webhook endpoints.
     */
    // Sends a question to Gemini and gives back the whole answer at once
    public Mono<String> generateContent(String prompt) {
        // Build the normal (non-streaming) URL
        String url = baseUrl + "/v1beta/models/" + model + ":generateContent?key=" + apiKey;
        // Build the JSON body that Gemini expects
        String requestBody = buildRequestBody(prompt);

        // Start a POST request
        return webClient.post()
                // Send it to the URL
                .uri(url)
                // Say we are sending JSON
                .contentType(MediaType.APPLICATION_JSON)
                // Attach the JSON body
                .bodyValue(requestBody)
                // Send it and get the response
                .retrieve()
                // Read the whole response as text
                .bodyToMono(String.class)
                // Pull the answer text out of the JSON
                .mapNotNull(this::extractTextFromFullResponse)
                // If Gemini fails, return a simple message instead of an error
                .onErrorReturn("Analysis unavailable — Gemini API error");
    }

    // Builds the JSON request body Gemini expects
    private String buildRequestBody(String prompt) {
        // Building JSON can fail, so we use try
        try {
            // The top-level JSON object
            ObjectNode root = objectMapper.createObjectNode();
            // The list of messages
            ArrayNode contents = objectMapper.createArrayNode();

            // One message from the user
            ObjectNode userMessage = objectMapper.createObjectNode();
            // Say the message is from the user
            userMessage.put("role", "user");
            // The list of parts inside the message
            ArrayNode parts = objectMapper.createArrayNode();
            // One part of the message
            ObjectNode part = objectMapper.createObjectNode();
            // Put our question text in the part
            part.put("text", prompt);
            // Add the part to the list of parts
            parts.add(part);
            // Attach the parts to the message
            userMessage.set("parts", parts);
            // Add the message to the list of messages
            contents.add(userMessage);

            // Attach the messages to the top-level object
            root.set("contents", contents);

            // Settings that control the answer
            ObjectNode generationConfig = objectMapper.createObjectNode();
            // The answer can be at most 2048 tokens long
            generationConfig.put("maxOutputTokens", 2048);
            // 0.7 is a balance between safe and creative answers
            generationConfig.put("temperature", 0.7);
            // Attach the settings to the top-level object
            root.set("generationConfig", generationConfig);

            // Turn the JSON object into text
            return objectMapper.writeValueAsString(root);
        } catch (Exception e) {
            // If anything goes wrong, stop with a clear message
            throw new RuntimeException("Failed to build Gemini request", e);
        }
    }

    // Parses one SSE data chunk: {"candidates":[{"content":{"parts":[{"text":"..."}]}}]}
    // Gets the answer text out of one piece of JSON from Gemini
    private String extractTextFromChunk(String json) {
        // Reading JSON can fail, so we use try
        try {
            // Turn the text into a JSON tree
            JsonNode root = objectMapper.readTree(json);
            // Go to the "candidates" list (the possible answers)
            JsonNode candidates = root.path("candidates");
            // Only continue if the list exists and has something in it
            if (candidates.isArray() && !candidates.isEmpty()) {
                // Go to the first answer's "parts" list
                JsonNode parts = candidates.get(0).path("content").path("parts");
                // Only continue if the list exists and has something in it
                if (parts.isArray() && !parts.isEmpty()) {
                    // Return the text of the first part (or empty text if missing)
                    return parts.get(0).path("text").asText("");
                }
            }
            // No text found, so return empty text
            return "";
        } catch (Exception e) {
            // If the JSON is broken, return empty text instead of crashing
            return "";
        }
    }

    // Parses the full non-streaming response body
    // Gets the answer text out of the full response
    private String extractTextFromFullResponse(String json) {
        return extractTextFromChunk(json);  // same structure, just one object not SSE
    }

    // Rough token count estimate (Gemini counts ~4 chars per token)
    // Guesses how many tokens a text uses
    public int estimateTokenCount(String text) {
        // Divide the length by 4, and never go below 1
        return Math.max(1, text.length() / 4);
    }
}
