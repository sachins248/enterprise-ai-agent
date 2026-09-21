// This file belongs to the service package (business logic)
package com.enterprise.agent.service;

// The data sent to analyze code
import com.enterprise.agent.dto.AnalyzeRequest;
// The answer we send back after analyzing code
import com.enterprise.agent.dto.AnalyzeResponse;
// The data sent to chat
import com.enterprise.agent.dto.ChatRequest;
// The database class for one chat message
import com.enterprise.agent.entity.AgentMessage;
// The database class for one chat session
import com.enterprise.agent.entity.AgentSession;
// The database class for one pipeline analysis
import com.enterprise.agent.entity.PipelineResult;
// Says who wrote a message (USER or ASSISTANT)
import com.enterprise.agent.enums.MessageRole;
// Database access for messages
import com.enterprise.agent.repository.AgentMessageRepository;
// Database access for sessions
import com.enterprise.agent.repository.AgentSessionRepository;
// Database access for pipeline results
import com.enterprise.agent.repository.PipelineResultRepository;
// Turns objects into JSON text
import com.fasterxml.jackson.databind.ObjectMapper;
// Sends messages to Kafka
import org.springframework.kafka.core.KafkaTemplate;
// Marks this class as a service
import org.springframework.stereotype.Service;
// Flux means "many results that arrive over time" (used in reactive code)
import reactor.core.publisher.Flux;
// Mono means "one result that arrives later" (used in reactive code)
import reactor.core.publisher.Mono;
// Lets us pick which thread runs some work
import reactor.core.scheduler.Schedulers;

// A type for a moment in time
import java.time.Instant;
// Used for lists
import java.util.List;
// Used to build small key-value data
import java.util.Map;
// We need this type for ids
import java.util.UUID;

// Marks this class as a service so Spring can create it
@Service
// This class has the main logic for chat, code analysis, sessions and pipelines
public class AgentService {

    // The Kafka topic (like a channel) where we announce what the agent did
    private static final String KAFKA_TOPIC = "agent-events";

    // Talks to the Gemini AI
    private final GeminiService geminiService;
    // Saves and loads sessions
    private final AgentSessionRepository sessionRepository;
    // Saves and loads messages
    private final AgentMessageRepository messageRepository;
    // Saves and loads pipeline results
    private final PipelineResultRepository pipelineResultRepository;
    // Sends events to Kafka
    private final KafkaTemplate<String, String> kafkaTemplate;
    // Turns objects into JSON text
    private final ObjectMapper objectMapper;

    // Spring gives us everything we need when it creates this class
    public AgentService(
            // For the AI
            GeminiService geminiService,
            // For sessions
            AgentSessionRepository sessionRepository,
            // For messages
            AgentMessageRepository messageRepository,
            // For pipeline results
            PipelineResultRepository pipelineResultRepository,
            // For Kafka
            KafkaTemplate<String, String> kafkaTemplate,
            // For JSON
            ObjectMapper objectMapper
    ) {
        // Save the AI service
        this.geminiService = geminiService;
        // Save the session repository
        this.sessionRepository = sessionRepository;
        // Save the message repository
        this.messageRepository = messageRepository;
        // Save the pipeline result repository
        this.pipelineResultRepository = pipelineResultRepository;
        // Save the Kafka sender
        this.kafkaTemplate = kafkaTemplate;
        // Save the JSON tool
        this.objectMapper = objectMapper;
    }

    /**
     * Streams a chat response. Returns a Flux of text chunks.
     * After all chunks are emitted, saves the full response to DB and publishes to Kafka.
     */
    // Starts a chat and gives back the answer piece by piece
    public Flux<String> chat(ChatRequest request) {
        // Turn the user id text into a UUID
        UUID userId = UUID.fromString(request.userId());

        // Get or create session reactively (never block the event loop)
        // Run the session lookup later, when a thread is ready
        return Mono.fromCallable(() -> getOrCreateSession(userId, request.sessionId()))
                // The database call blocks, so run it on a thread meant for blocking work
                .subscribeOn(Schedulers.boundedElastic())
                // Once we have the session, turn it into a stream of answer pieces
                .flatMapMany(session -> {
                    // Save user message in background
                    // Save the question without making the user wait
                    Mono.fromCallable(() -> saveMessage(session.getId(), MessageRole.USER, request.prompt(), null))
                            // The database call blocks, so use the blocking-friendly threads
                            .subscribeOn(Schedulers.boundedElastic())
                            // Start it now (nobody waits for the result)
                            .subscribe();

                    // Add the code context (if any) to the question
                    String fullPrompt = buildPrompt(request.prompt(), request.codeContext());
                    // We collect all answer pieces here so we can save the full answer at the end
                    StringBuilder fullResponse = new StringBuilder();

                    // Ask Gemini and get the answer piece by piece
                    return geminiService.streamChat(fullPrompt)
                            // For each piece, add it to the full answer
                            .doOnNext(fullResponse::append)
                            // When the answer is finished, do the steps below
                            .doOnComplete(() -> {
                                // Turn the collected pieces into one text
                                String responseText = fullResponse.toString();
                                // Estimate tokens used by the question and the answer together
                                int tokenCount = geminiService.estimateTokenCount(request.prompt()) +
                                                 geminiService.estimateTokenCount(responseText);
                                // Save and announce the answer without making the user wait
                                Mono.fromCallable(() -> {
                                    // Save the AI's answer in the database
                                    saveMessage(session.getId(), MessageRole.ASSISTANT, responseText, tokenCount);
                                    // Tell Kafka about this chat (audit and analytics listen to it)
                                    publishAgentEvent(userId.toString(), session.getId().toString(), "CHAT", tokenCount);
                                    // Nothing to return
                                    return null;
                                // Use the blocking-friendly threads, then start it now
                                }).subscribeOn(Schedulers.boundedElastic()).subscribe();
                            });
                });
    }

    /**
     * Analyzes code for bugs/issues. Non-streaming, returns full analysis.
     */
    // Asks the AI to review some code and gives back the full answer
    public Mono<AnalyzeResponse> analyze(AnalyzeRequest request) {
        // Build the question we send to the AI
        String prompt = String.format(
                // The instructions for the AI
                "Analyze this %s code for bugs, security issues, and code quality problems. " +
                // Ask for exact lines and how serious each problem is
                "Be specific about line numbers and severity. Code:\n\n```%s\n%s\n```",
                // Fill in the language (twice) and the code
                request.language(), request.language(), request.code()
        );

        // Ask the AI and wait for the full answer
        return geminiService.generateContent(prompt)
                // Wrap the answer in our response type
                .map(analysis -> new AnalyzeResponse(analysis, request.language()));
    }

    // Get all sessions for a user
    public List<AgentSession> getSessions(String userId) {
        // Look them up, newest first
        return sessionRepository.findByUserIdOrderByCreatedAtDesc(UUID.fromString(userId));
    }

    // Get all messages in a session
    public List<AgentMessage> getMessages(String sessionId) {
        // Look them up, oldest first
        return messageRepository.findBySessionIdOrderByCreatedAtAsc(UUID.fromString(sessionId));
    }

    // Analyzes a GitHub push and saves the result
    public PipelineResult analyzeWebhook(String repoName, String commitHash, String diff) {
        // Build the question we send to the AI
        String prompt = "Analyze this code diff for bugs, security issues, and code quality problems. Be specific.\n\n" + diff;

        // Ask the AI and wait for the answer (this runs on a blocking-friendly thread, so waiting is OK)
        String analysis = geminiService.generateContent(prompt).block();
        // Guess how many problems the answer mentions
        int issueCount = countIssues(analysis);

        // Make a new result row
        PipelineResult result = new PipelineResult();
        // Set the repository name
        result.setRepoName(repoName);
        // Set the commit id
        result.setCommitHash(commitHash);
        // Set the analysis, or a fallback message if the AI gave nothing
        result.setAnalysis(analysis != null ? analysis : "Analysis unavailable");
        // Set the issue count
        result.setIssueCount(issueCount);

        // Save it and return the saved row
        return pipelineResultRepository.save(result);
    }

    // Get the newest analysis for a repository
    public PipelineResult getLatestPipelineResult(String repoName) {
        // Look it up
        return pipelineResultRepository.findTopByRepoNameOrderByCreatedAtDesc(repoName)
                // If there is none, tell the caller
                .orElseThrow(() -> new IllegalArgumentException("No results for repo: " + repoName));
    }

    // Get all analyses for a repository
    public List<PipelineResult> getPipelineHistory(String repoName) {
        // Look them up, newest first
        return pipelineResultRepository.findByRepoNameOrderByCreatedAtDesc(repoName);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    // Find an existing session, or make a new one
    private AgentSession getOrCreateSession(UUID userId, String sessionIdStr) {
        // If the client gave us a session id, try to use it
        if (sessionIdStr != null && !sessionIdStr.isBlank()) {
            // Look the session up by id
            return sessionRepository.findById(UUID.fromString(sessionIdStr))
                    // If it does not exist, make a new one
                    .orElseGet(() -> createSession(userId));
        }
        // No session id given, so start a new session
        return createSession(userId);
    }

    // Make and save a new session
    private AgentSession createSession(UUID userId) {
        // Make a new empty session
        AgentSession session = new AgentSession();
        // Set who owns it
        session.setUserId(userId);
        // Give it a simple title based on the current time
        session.setTitle("Session " + Instant.now().toEpochMilli());
        // Save it and return the saved row
        return sessionRepository.save(session);
    }

    // Make and save one message
    private AgentMessage saveMessage(UUID sessionId, MessageRole role, String content, Integer tokenCount) {
        // Make a new empty message
        AgentMessage message = new AgentMessage();
        // Set which session it belongs to
        message.setSessionId(sessionId);
        // Set who wrote it
        message.setRole(role);
        // Set the text
        message.setContent(content);
        // Set the token count (can be null)
        message.setTokenCount(tokenCount);
        // Save it and return the saved row
        return messageRepository.save(message);
    }

    // Tell Kafka that the agent did something
    private void publishAgentEvent(String userId, String sessionId, String action, int tokenCount) {
        // Making JSON can fail, so we use try
        try {
            // Turn a small map into JSON text
            String event = objectMapper.writeValueAsString(Map.of(
                    // Who did it
                    "userId", userId,
                    // Which session
                    "sessionId", sessionId,
                    // What kind of action (like CHAT)
                    "action", action,
                    // How many tokens it used
                    "tokenCount", tokenCount,
                    // When it happened
                    "timestamp", Instant.now().toString()
            ));
            // Send it to Kafka (the user id is the key, so one user's events stay in order)
            kafkaTemplate.send(KAFKA_TOPIC, userId, event);
        } catch (Exception e) {
            // Log but don't fail the request — audit is best-effort
            // Print the problem so we can see it, but keep going
            System.err.println("Failed to publish agent event: " + e.getMessage());
        }
    }

    // Adds the code (if there is any) to the user's question
    private String buildPrompt(String userPrompt, String codeContext) {
        // If there is no code, just use the question
        if (codeContext == null || codeContext.isBlank()) {
            // Return the question as it is
            return userPrompt;
        }
        // Put the code first, then the question
        return "Here is the code context:\n```\n" + codeContext + "\n```\n\nQuestion: " + userPrompt;
    }

    // Guesses how many problems an analysis talks about
    private int countIssues(String analysis) {
        // No analysis means no issues
        if (analysis == null) return 0;
        // Make it lowercase so "Bug" and "bug" both count
        String lower = analysis.toLowerCase();
        // Rough heuristic — count occurrences of issue/bug/error/vulnerability
        // This starts at 0 and goes up for each word we find
        int count = 0;
        // Go through each word that suggests a problem
        for (String keyword : List.of("bug", "issue", "error", "vulnerability", "problem", "warning")) {
            // Start searching from the beginning
            int idx = 0;
            // Keep searching until there are no more matches
            while ((idx = lower.indexOf(keyword, idx)) != -1) {
                // Count this match
                count++;
                // Move past this match so we don't count it again
                idx += keyword.length();
            }
        }
        // Never go above 50 so the number stays sensible
        return Math.min(count, 50); // cap at 50
    }
}
