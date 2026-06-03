package com.enterprise.agent.controller;

import com.enterprise.agent.dto.AnalyzeRequest;
import com.enterprise.agent.dto.AnalyzeResponse;
import com.enterprise.agent.dto.ChatRequest;
import com.enterprise.agent.dto.WebhookRequest;
import com.enterprise.agent.entity.AgentMessage;
import com.enterprise.agent.entity.AgentSession;
import com.enterprise.agent.entity.PipelineResult;
import com.enterprise.agent.security.WebhookSignatureVerifier;
import com.enterprise.agent.service.AgentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/agent")
public class AgentController {

    private final AgentService agentService;
    private final WebhookSignatureVerifier signatureVerifier;

    public AgentController(AgentService agentService, WebhookSignatureVerifier signatureVerifier) {
        this.agentService = agentService;
        this.signatureVerifier = signatureVerifier;
    }

    /**
     * Streams the Gemini response back to the client using Server-Sent Events.
     * The frontend receives chunks of text as they arrive, enabling a "typing" effect.
     */
    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> chat(@RequestBody ChatRequest request) {
        return agentService.chat(request)
                .map(chunk -> ServerSentEvent.<String>builder()
                        .event("message")
                        .data(chunk)
                        .build())
                .concatWith(Flux.just(ServerSentEvent.<String>builder()
                        .event("done")
                        .data("[DONE]")
                        .build()));
    }

    @PostMapping("/analyze")
    public Mono<AnalyzeResponse> analyze(@RequestBody AnalyzeRequest request) {
        return agentService.analyze(request);
    }

    @GetMapping("/sessions/{userId}")
    public List<AgentSession> getSessions(@PathVariable String userId) {
        return agentService.getSessions(userId);
    }

    @GetMapping("/sessions/{sessionId}/messages")
    public List<AgentMessage> getMessages(@PathVariable String sessionId) {
        return agentService.getMessages(sessionId);
    }

    // GitHub webhook — receives push event, analyzes the diff with Gemini
    @PostMapping("/webhook/github")
    public Mono<PipelineResult> githubWebhook(
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
            @RequestBody String rawBody
    ) {
        if (!signatureVerifier.isValid(signature, rawBody)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid webhook signature");
        }

        WebhookRequest payload;
        try {
            payload = new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(rawBody, WebhookRequest.class);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid webhook payload");
        }
        String repoName = payload.repository() != null ? payload.repository().fullName() : "unknown";
        String commitHash = payload.headCommit() != null ? payload.headCommit().id() : "unknown";

        // Build a summary of changed files to send to Gemini
        StringBuilder diff = new StringBuilder();
        diff.append("Repository: ").append(repoName).append("\n");
        diff.append("Commit: ").append(commitHash).append("\n\n");

        if (payload.commits() != null) {
            for (var commit : payload.commits()) {
                if (commit.added() != null && !commit.added().isEmpty()) {
                    diff.append("Added files: ").append(commit.added()).append("\n");
                }
                if (commit.modified() != null && !commit.modified().isEmpty()) {
                    diff.append("Modified files: ").append(commit.modified()).append("\n");
                }
                if (commit.removed() != null && !commit.removed().isEmpty()) {
                    diff.append("Removed files: ").append(commit.removed()).append("\n");
                }
            }
        }

        return Mono.fromCallable(() ->
                agentService.analyzeWebhook(repoName, commitHash, diff.toString())
        ).subscribeOn(reactor.core.scheduler.Schedulers.boundedElastic());
    }

    @GetMapping("/pipeline/{repoName}/latest")
    public PipelineResult getLatestPipelineResult(@PathVariable String repoName) {
        return agentService.getLatestPipelineResult(repoName);
    }

    @GetMapping("/pipeline/{repoName}/history")
    public List<PipelineResult> getPipelineHistory(@PathVariable String repoName) {
        return agentService.getPipelineHistory(repoName);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public Mono<Map<String, String>> handleBadRequest(IllegalArgumentException e) {
        return Mono.just(Map.of("error", e.getMessage()));
    }
}
