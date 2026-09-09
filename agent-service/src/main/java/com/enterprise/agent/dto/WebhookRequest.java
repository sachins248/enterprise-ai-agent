package com.enterprise.agent.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

// GitHub push event payload (only the fields we need)
public record WebhookRequest(
        String ref,
        @JsonProperty("head_commit") HeadCommit headCommit,
        Repository repository,
        List<Commit> commits
) {
    public record HeadCommit(String id, String message) {}
    public record Repository(String name, @JsonProperty("full_name") String fullName) {}
    public record Commit(String id, List<String> added, List<String> modified, List<String> removed) {}
}
