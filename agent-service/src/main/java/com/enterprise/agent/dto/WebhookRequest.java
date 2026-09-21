// This file belongs to the dto package (simple data holders)
package com.enterprise.agent.dto;

// Lets us match GitHub's names (like head_commit) to our Java names (headCommit)
import com.fasterxml.jackson.annotation.JsonProperty;
// Used for lists
import java.util.List;

// GitHub push event payload (only the fields we need)
public record WebhookRequest(
        // The branch that was pushed to
        String ref,
        // GitHub calls this "head_commit", and it is the newest commit
        @JsonProperty("head_commit") HeadCommit headCommit,
        // The repository that was pushed to
        Repository repository,
        // All commits in this push
        List<Commit> commits
) {
    // The newest commit: its id and message
    public record HeadCommit(String id, String message) {}
    // The repository: its short name and full name (like owner/repo)
    public record Repository(String name, @JsonProperty("full_name") String fullName) {}
    // One commit: its id and the files it added, changed and removed
    public record Commit(String id, List<String> added, List<String> modified, List<String> removed) {}
}
