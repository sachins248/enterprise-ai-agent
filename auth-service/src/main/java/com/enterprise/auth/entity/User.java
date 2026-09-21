// This file belongs to the entity package (database tables)
package com.enterprise.auth.entity;

// We need the Role type
import com.enterprise.auth.enums.Role;
// We need the JPA annotations that map this class to a table
import jakarta.persistence.*;
// Spring Security uses this type for permissions
import org.springframework.security.core.GrantedAuthority;
// A simple ready-made permission type
import org.springframework.security.core.authority.SimpleGrantedAuthority;
// Spring Security uses this to know who a user is
import org.springframework.security.core.userdetails.UserDetails;

// We need this type for the created time
import java.time.LocalDateTime;
// We need this type for the list of permissions
import java.util.Collection;
// We use List.of to make a small list
import java.util.List;
// We need this type for ids
import java.util.UUID;

// Says this class is a database table
@Entity
// The table is called users
@Table(name = "users")
// One row = one user. It also works as a Spring Security user
public class User implements UserDetails {

    // This field is the primary key
    @Id
    // The database makes a new random UUID for each row
    @GeneratedValue(strategy = GenerationType.UUID)
    // The id of this user
    private UUID id;

    // Email must be unique and can't be empty
    @Column(unique = true, nullable = false)
    // The user's email (also used as their login name)
    private String email;

    // Can't be empty
    @Column(nullable = false)
    // The password, stored as a hash (never the real password)
    private String password;

    // Save the role as text (like "ADMIN") instead of a number
    @Enumerated(EnumType.STRING)
    // Can't be empty
    @Column(nullable = false)
    // The user's role
    private Role role;

    // The team this user belongs to (can be empty)
    private String teamId;

    // Can't be empty
    @Column(nullable = false)
    // When the account was created
    private LocalDateTime createdAt;

    // Runs just before the row is saved for the first time
    @PrePersist
    protected void onCreate() {
        // Set the created time to right now
        createdAt = LocalDateTime.now();
    }

    // UserDetails — Spring Security uses these to make auth decisions
    // Tells Spring Security what this user is allowed to do
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Spring expects role names to start with ROLE_
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    // Spring Security asks for a "username", and for us that is the email
    @Override
    public String getUsername() { return email; }

    // We never expire accounts, so always true
    @Override
    public boolean isAccountNonExpired() { return true; }

    // We never lock accounts, so always true
    @Override
    public boolean isAccountNonLocked() { return true; }

    // We never expire passwords, so always true
    @Override
    public boolean isCredentialsNonExpired() { return true; }

    // Every account is enabled, so always true
    @Override
    public boolean isEnabled() { return true; }

    // Getters and setters
    // Read the id
    public UUID getId() { return id; }
    // Set the id
    public void setId(UUID id) { this.id = id; }

    // Read the email
    public String getEmail() { return email; }
    // Set the email
    public void setEmail(String email) { this.email = email; }

    // Read the password hash (Spring Security needs this to check logins)
    public String getPassword() { return password; }
    // Set the password hash
    public void setPassword(String password) { this.password = password; }

    // Read the role
    public Role getRole() { return role; }
    // Set the role
    public void setRole(Role role) { this.role = role; }

    // Read the team id
    public String getTeamId() { return teamId; }
    // Set the team id
    public void setTeamId(String teamId) { this.teamId = teamId; }

    // Read the created time (no setter because it is set automatically)
    public LocalDateTime getCreatedAt() { return createdAt; }
}
