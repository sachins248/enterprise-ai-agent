// This file belongs to the entity package (database tables)
package com.enterprise.auth.entity;

// We need the JPA annotations that map this class to a table
import jakarta.persistence.*;

// We need this type for the expiry time
import java.time.LocalDateTime;
// We need this type for ids
import java.util.UUID;

// Says this class is a database table
@Entity
// The table is called refresh_tokens
@Table(name = "refresh_tokens")
// One row = one refresh token we gave to a user
public class RefreshToken {

    // This field is the primary key
    @Id
    // The database makes a new random UUID for each row
    @GeneratedValue(strategy = GenerationType.UUID)
    // The id of this row
    private UUID id;

    // This column can't be empty
    @Column(nullable = false)
    // The id of the user who owns this token
    private UUID userId;

    // Can't be empty, must be unique, and can be up to 512 characters
    @Column(nullable = false, unique = true, length = 512)
    // The random token text
    private String token;

    // This column can't be empty
    @Column(nullable = false)
    // When this token stops working
    private LocalDateTime expiresAt;

    // Getters and setters
    // Read the id (there is no setter because the database makes it)
    public UUID getId() { return id; }

    // Read the owner's id
    public UUID getUserId() { return userId; }
    // Set the owner's id
    public void setUserId(UUID userId) { this.userId = userId; }

    // Read the token text
    public String getToken() { return token; }
    // Set the token text
    public void setToken(String token) { this.token = token; }

    // Read the expiry time
    public LocalDateTime getExpiresAt() { return expiresAt; }
    // Set the expiry time
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
}
