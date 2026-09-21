// This file belongs to the entity package (database tables)
package com.enterprise.agent.entity;

// We need the JPA annotations that map this class to a table
import jakarta.persistence.*;

// We need this type for the created time
import java.time.LocalDateTime;
// We need this type for ids
import java.util.UUID;

// Says this class is a database table
@Entity
// The table is called pipeline_results
@Table(name = "pipeline_results")
// One row = the AI's analysis of one GitHub push
public class PipelineResult {

    // This field is the primary key
    @Id
    // The database makes a new random UUID for each row
    @GeneratedValue(strategy = GenerationType.UUID)
    // The id of this result
    private UUID id;

    // This column can't be empty
    @Column(nullable = false)
    // The repository that was pushed to
    private String repoName;

    // This column can't be empty
    @Column(nullable = false)
    // The commit that was analyzed
    private String commitHash;

    // This column can't be empty and uses a big text type because analyses can be long
    @Column(nullable = false, columnDefinition = "TEXT")
    // The AI's analysis text
    private String analysis;

    // About how many problems the analysis found (can be empty)
    private Integer issueCount;

    // This column can't be empty
    @Column(nullable = false)
    // When the result was saved
    private LocalDateTime createdAt;

    // Runs just before the row is saved for the first time
    @PrePersist
    protected void onCreate() {
        // Set the created time to right now
        createdAt = LocalDateTime.now();
    }

    // Read the id (there is no setter because the database makes it)
    public UUID getId() { return id; }

    // Read the repository name
    public String getRepoName() { return repoName; }
    // Set the repository name
    public void setRepoName(String repoName) { this.repoName = repoName; }

    // Read the commit id
    public String getCommitHash() { return commitHash; }
    // Set the commit id
    public void setCommitHash(String commitHash) { this.commitHash = commitHash; }

    // Read the analysis text
    public String getAnalysis() { return analysis; }
    // Set the analysis text
    public void setAnalysis(String analysis) { this.analysis = analysis; }

    // Read the issue count
    public Integer getIssueCount() { return issueCount; }
    // Set the issue count
    public void setIssueCount(Integer issueCount) { this.issueCount = issueCount; }

    // Read the created time (no setter because it is set automatically)
    public LocalDateTime getCreatedAt() { return createdAt; }
}
