// This file belongs to the controller package (web endpoints)
package com.enterprise.agent.controller;

// The data sent to analyze code
import com.enterprise.agent.dto.AnalyzeRequest;
// The answer we send back after analyzing code
import com.enterprise.agent.dto.AnalyzeResponse;
// The data sent to chat
import com.enterprise.agent.dto.ChatRequest;
// The data GitHub sends us in a webhook
import com.enterprise.agent.dto.WebhookRequest;
// The database class for one chat message
import com.enterprise.agent.entity.AgentMessage;
// The database class for one chat session
import com.enterprise.agent.entity.AgentSession;
// The database class for one pipeline analysis
import com.enterprise.agent.entity.PipelineResult;
// Checks that a webhook really came from GitHub
import com.enterprise.agent.security.WebhookSignatureVerifier;
// The service that does the real work
import com.enterprise.agent.service.AgentService;
// Lets us pick HTTP status codes like 401
import org.springframework.http.HttpStatus;
// Lets us say the response type is a stream of events
import org.springframework.http.MediaType;
// One message in a Server-Sent Events stream
import org.springframework.http.codec.ServerSentEvent;
// Import the web annotations like @GetMapping
import org.springframework.web.bind.annotation.*;
// Lets us throw an error with an HTTP status
import org.springframework.web.server.ResponseStatusException;
// Flux means "many results that arrive over time" (used in reactive code)
import reactor.core.publisher.Flux;
// Mono means "one result that arrives later" (used in reactive code)
import reactor.core.publisher.Mono;

// Used for lists
import java.util.List;
// Used to build a small JSON error
import java.util.Map;

// Says this class answers web requests and returns JSON
@RestController
// All endpoints in this class start with /agent
@RequestMapping("/agent")
// This class has the chat, analyze, session, webhook and pipeline endpoints
public class AgentController {

    // The service that does the real work
    private final AgentService agentService;
    // Checks the signature on GitHub webhooks
    private final WebhookSignatureVerifier signatureVerifier;

    // Spring gives us both helpers when it creates this class
    public AgentController(AgentService agentService, WebhookSignatureVerifier signatureVerifier) {
        // Save the service
        this.agentService = agentService;
        // Save the signature checker
        this.signatureVerifier = signatureVerifier;
    }

    /**
     * Streams the Gemini response back to the client using Server-Sent Events.
     * The frontend receives chunks of text as they arrive, enabling a "typing" effect.
     */
    // Runs when someone sends POST /agent/chat, and the answer is a stream of events
    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> chat(@RequestBody ChatRequest request) {
        // Ask the service for the answer as a stream of text pieces
        return agentService.chat(request)
                // Wrap each piece of text in an event
                .map(chunk -> ServerSentEvent.<String>builder()
                        // Name the event "message" so the frontend knows it is text
                        .event("message")
                        // Put the text piece inside the event
                        .data(chunk)
                        // Finish building this event
                        .build())
                // After all the text, add one last event
                .concatWith(Flux.just(ServerSentEvent.<String>builder()
                        // Name it "done" so the frontend knows the answer is finished
                        .event("done")
                        // The data says we are done
                        .data("[DONE]")
                        // Finish building this event
                        .build()));
    }

    // Runs when someone sends POST /agent/analyze
    @PostMapping("/analyze")
    public Mono<AnalyzeResponse> analyze(@RequestBody AnalyzeRequest request) {
        // Ask the service to analyze the code and send back the result
        return agentService.analyze(request);
    }

    // Runs when someone sends GET /agent/sessions/{userId}
    @GetMapping("/sessions/{userId}")
    public List<AgentSession> getSessions(@PathVariable String userId) {
        // Return all chat sessions for that user
        return agentService.getSessions(userId);
    }

    // Runs when someone sends GET /agent/sessions/{sessionId}/messages
    @GetMapping("/sessions/{sessionId}/messages")
    public List<AgentMessage> getMessages(@PathVariable String sessionId) {
        // Return all messages in that session
        return agentService.getMessages(sessionId);
    }

    // GitHub webhook — receives push event, analyzes the diff with Gemini
    // Runs when GitHub sends POST /agent/webhook/github
    @PostMapping("/webhook/github")
    public Mono<PipelineResult> githubWebhook(
            // GitHub puts its signature in this header (it can be missing)
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
            // We read the raw text because the signature is made from the exact raw text
            @RequestBody String rawBody
    ) {
        // Check the signature to make sure the request really came from GitHub
        if (!signatureVerifier.isValid(signature, rawBody)) {
            // If it does not match, reject with 401 (Unauthorized)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid webhook signature");
        }

        // This will hold the payload after we read it
        WebhookRequest payload;
        // Reading JSON can fail, so we use try
        try {
            // Turn the raw JSON text into a WebhookRequest object
            payload = new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(rawBody, WebhookRequest.class);
        } catch (Exception e) {
            // If the JSON is broken, reject with 400 (Bad Request)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid webhook payload");
        }
        // Get the repository name, or "unknown" if missing
        String repoName = payload.repository() != null ? payload.repository().fullName() : "unknown";
        // Get the latest commit id, or "unknown" if missing
        String commitHash = payload.headCommit() != null ? payload.headCommit().id() : "unknown";

        // Build a summary of changed files to send to Gemini
        // A StringBuilder lets us add text piece by piece
        StringBuilder diff = new StringBuilder();
        // Add the repository name
        diff.append("Repository: ").append(repoName).append("\n");
        // Add the commit id and a blank line
        diff.append("Commit: ").append(commitHash).append("\n\n");

        // Only loop if GitHub sent a list of commits
        if (payload.commits() != null) {
            // Go through each commit in the push
            for (var commit : payload.commits()) {
                // If the commit added files, list them
                if (commit.added() != null && !commit.added().isEmpty()) {
                    // Add the list of new files
                    diff.append("Added files: ").append(commit.added()).append("\n");
                }
                // If the commit changed files, list them
                if (commit.modified() != null && !commit.modified().isEmpty()) {
                    // Add the list of changed files
                    diff.append("Modified files: ").append(commit.modified()).append("\n");
                }
                // If the commit deleted files, list them
                if (commit.removed() != null && !commit.removed().isEmpty()) {
                    // Add the list of deleted files
                    diff.append("Removed files: ").append(commit.removed()).append("\n");
                }
            }
        }

        // Run the analysis later, when a thread is ready
        return Mono.fromCallable(() ->
                // Ask the service to analyze the changes and save the result
                agentService.analyzeWebhook(repoName, commitHash, diff.toString())
        // This work blocks, so run it on a thread meant for blocking work
        ).subscribeOn(reactor.core.scheduler.Schedulers.boundedElastic());
    }

    // Runs when someone sends GET /agent/pipeline/{repoName}/latest
    @GetMapping("/pipeline/{repoName}/latest")
    public PipelineResult getLatestPipelineResult(@PathVariable String repoName) {
        // Return the newest analysis for that repository
        return agentService.getLatestPipelineResult(repoName);
    }

    // Runs when someone sends GET /agent/pipeline/{repoName}/history
    @GetMapping("/pipeline/{repoName}/history")
    public List<PipelineResult> getPipelineHistory(@PathVariable String repoName) {
        // Return all analyses for that repository, newest first
        return agentService.getPipelineHistory(repoName);
    }

    // Runs when any method above throws IllegalArgumentException
    @ExceptionHandler(IllegalArgumentException.class)
    public Mono<Map<String, String>> handleBadRequest(IllegalArgumentException e) {
        // Send the error message back as JSON
        return Mono.just(Map.of("error", e.getMessage()));
    }
}
