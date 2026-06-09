package com.enterprise.agent.service;

import com.enterprise.agent.dto.AnalyzeRequest;
import com.enterprise.agent.dto.AnalyzeResponse;
import com.enterprise.agent.dto.ChatRequest;
import com.enterprise.agent.entity.AgentMessage;
import com.enterprise.agent.entity.AgentSession;
import com.enterprise.agent.entity.PipelineResult;
import com.enterprise.agent.enums.MessageRole;
import com.enterprise.agent.repository.AgentMessageRepository;
import com.enterprise.agent.repository.AgentSessionRepository;
import com.enterprise.agent.repository.PipelineResultRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AgentService {

    private static final String KAFKA_TOPIC = "agent-events";

    private final GeminiService geminiService;
    private final AgentSessionRepository sessionRepository;
    private final AgentMessageRepository messageRepository;
    private final PipelineResultRepository pipelineResultRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public AgentService(
            GeminiService geminiService,
            AgentSessionRepository sessionRepository,
            AgentMessageRepository messageRepository,
            PipelineResultRepository pipelineResultRepository,
            KafkaTemplate<String, String> kafkaTemplate,
            ObjectMapper objectMapper
    ) {
        this.geminiService = geminiService;
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.pipelineResultRepository = pipelineResultRepository;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Streams a chat response. Returns a Flux of text chunks.
     * After all chunks are emitted, saves the full response to DB and publishes to Kafka.
     */
    public Flux<String> chat(ChatRequest request) {
        UUID userId = UUID.fromString(request.userId());

        // Get or create session reactively (never block the event loop)
        return Mono.fromCallable(() -> getOrCreateSession(userId, request.sessionId()))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMapMany(session -> {
                    // Save user message in background
                    Mono.fromCallable(() -> saveMessage(session.getId(), MessageRole.USER, request.prompt(), null))
                            .subscribeOn(Schedulers.boundedElastic())
                            .subscribe();

                    String fullPrompt = buildPrompt(request.prompt(), request.codeContext());
                    StringBuilder fullResponse = new StringBuilder();

                    return geminiService.streamChat(fullPrompt)
                            .doOnNext(fullResponse::append)
                            .doOnComplete(() -> {
                                String responseText = fullResponse.toString();
                                int tokenCount = geminiService.estimateTokenCount(request.prompt()) +
                                                 geminiService.estimateTokenCount(responseText);
                                Mono.fromCallable(() -> {
                                    saveMessage(session.getId(), MessageRole.ASSISTANT, responseText, tokenCount);
                                    publishAgentEvent(userId.toString(), session.getId().toString(), "CHAT", tokenCount);
                                    return null;
                                }).subscribeOn(Schedulers.boundedElastic()).subscribe();
                            });
                });
    }

    /**
     * Analyzes code for bugs/issues. Non-streaming, returns full analysis.
     */
    public Mono<AnalyzeResponse> analyze(AnalyzeRequest request) {
        String prompt = String.format(
                "Analyze this %s code for bugs, security issues, and code quality problems. " +
                "Be specific about line numbers and severity. Code:\n\n```%s\n%s\n```",
                request.language(), request.language(), request.code()
        );

        return geminiService.generateContent(prompt)
                .map(analysis -> new AnalyzeResponse(analysis, request.language()));
    }

    public List<AgentSession> getSessions(String userId) {
        return sessionRepository.findByUserIdOrderByCreatedAtDesc(UUID.fromString(userId));
    }

    public List<AgentMessage> getMessages(String sessionId) {
        return messageRepository.findBySessionIdOrderByCreatedAtAsc(UUID.fromString(sessionId));
    }

    public PipelineResult analyzeWebhook(String repoName, String commitHash, String diff) {
        String prompt = "Analyze this code diff for bugs, security issues, and code quality problems. Be specific.\n\n" + diff;

        String analysis = geminiService.generateContent(prompt).block();
        int issueCount = countIssues(analysis);

        PipelineResult result = new PipelineResult();
        result.setRepoName(repoName);
        result.setCommitHash(commitHash);
        result.setAnalysis(analysis != null ? analysis : "Analysis unavailable");
        result.setIssueCount(issueCount);

        return pipelineResultRepository.save(result);
    }

    public PipelineResult getLatestPipelineResult(String repoName) {
        return pipelineResultRepository.findTopByRepoNameOrderByCreatedAtDesc(repoName)
                .orElseThrow(() -> new IllegalArgumentException("No results for repo: " + repoName));
    }

    public List<PipelineResult> getPipelineHistory(String repoName) {
        return pipelineResultRepository.findByRepoNameOrderByCreatedAtDesc(repoName);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private AgentSession getOrCreateSession(UUID userId, String sessionIdStr) {
        if (sessionIdStr != null && !sessionIdStr.isBlank()) {
            return sessionRepository.findById(UUID.fromString(sessionIdStr))
                    .orElseGet(() -> createSession(userId));
        }
        return createSession(userId);
    }

    private AgentSession createSession(UUID userId) {
        AgentSession session = new AgentSession();
        session.setUserId(userId);
        session.setTitle("Session " + Instant.now().toEpochMilli());
        return sessionRepository.save(session);
    }

    private AgentMessage saveMessage(UUID sessionId, MessageRole role, String content, Integer tokenCount) {
        AgentMessage message = new AgentMessage();
        message.setSessionId(sessionId);
        message.setRole(role);
        message.setContent(content);
        message.setTokenCount(tokenCount);
        return messageRepository.save(message);
    }

    private void publishAgentEvent(String userId, String sessionId, String action, int tokenCount) {
        try {
            String event = objectMapper.writeValueAsString(Map.of(
                    "userId", userId,
                    "sessionId", sessionId,
                    "action", action,
                    "tokenCount", tokenCount,
                    "timestamp", Instant.now().toString()
            ));
            kafkaTemplate.send(KAFKA_TOPIC, userId, event);
        } catch (Exception e) {
            // Log but don't fail the request — audit is best-effort
            System.err.println("Failed to publish agent event: " + e.getMessage());
        }
    }

    private String buildPrompt(String userPrompt, String codeContext) {
        if (codeContext == null || codeContext.isBlank()) {
            return userPrompt;
        }
        return "Here is the code context:\n```\n" + codeContext + "\n```\n\nQuestion: " + userPrompt;
    }

    private int countIssues(String analysis) {
        if (analysis == null) return 0;
        String lower = analysis.toLowerCase();
        // Rough heuristic — count occurrences of issue/bug/error/vulnerability
        int count = 0;
        for (String keyword : List.of("bug", "issue", "error", "vulnerability", "problem", "warning")) {
            int idx = 0;
            while ((idx = lower.indexOf(keyword, idx)) != -1) {
                count++;
                idx += keyword.length();
            }
        }
        return Math.min(count, 50); // cap at 50
    }
}
