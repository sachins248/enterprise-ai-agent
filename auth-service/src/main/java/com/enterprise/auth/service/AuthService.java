// This file belongs to the service package (business logic)
package com.enterprise.auth.service;

// Import all the request and response classes
import com.enterprise.auth.dto.*;
// The refresh token table class
import com.enterprise.auth.entity.RefreshToken;
// The user table class
import com.enterprise.auth.entity.User;
// The list of roles
import com.enterprise.auth.enums.Role;
// Database access for refresh tokens
import com.enterprise.auth.repository.RefreshTokenRepository;
// Database access for users
import com.enterprise.auth.repository.UserRepository;
// Makes the access tokens
import com.enterprise.auth.security.JwtService;
// Lets us read numbers from application.properties
import org.springframework.beans.factory.annotation.Value;
// Checks the email and password when someone logs in
import org.springframework.security.authentication.AuthenticationManager;
// Holds the email and password we want to check
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
// Turns a password into a safe hash
import org.springframework.security.crypto.password.PasswordEncoder;
// Marks this class as a service
import org.springframework.stereotype.Service;
// Makes database changes all succeed or all fail together
import org.springframework.transaction.annotation.Transactional;

// A type for date and time
import java.time.LocalDateTime;
// Used to make random token text
import java.util.UUID;

// Marks this class as a service so Spring can create it
@Service
// This class has the main login logic: register, login, refresh and "me"
public class AuthService {

    // For finding and saving users
    private final UserRepository userRepository;
    // For finding and saving refresh tokens
    private final RefreshTokenRepository refreshTokenRepository;
    // For making access tokens
    private final JwtService jwtService;
    // For hashing passwords
    private final PasswordEncoder passwordEncoder;
    // For checking logins
    private final AuthenticationManager authenticationManager;

    // Read the access token lifetime from application.properties
    @Value("${jwt.access-token.expiration-ms}")
    // How long an access token lasts, in milliseconds
    private long accessTokenExpirationMs;

    // Read the refresh token lifetime from application.properties
    @Value("${jwt.refresh-token.expiration-ms}")
    // How long a refresh token lasts, in milliseconds
    private long refreshTokenExpirationMs;

    // Spring gives us everything we need when it creates this class
    public AuthService(
            // For users
            UserRepository userRepository,
            // For refresh tokens
            RefreshTokenRepository refreshTokenRepository,
            // For access tokens
            JwtService jwtService,
            // For passwords
            PasswordEncoder passwordEncoder,
            // For login checks
            AuthenticationManager authenticationManager
    ) {
        // Save the user repository
        this.userRepository = userRepository;
        // Save the refresh token repository
        this.refreshTokenRepository = refreshTokenRepository;
        // Save the JWT service
        this.jwtService = jwtService;
        // Save the password encoder
        this.passwordEncoder = passwordEncoder;
        // Save the authentication manager
        this.authenticationManager = authenticationManager;
    }

    // If anything fails, undo all database changes made in this method
    @Transactional
    // Create a new account and log the user in right away
    public AuthResponse register(RegisterRequest request) {
        // Check if this email is already used
        if (userRepository.existsByEmail(request.email())) {
            // Stop and tell the user (emails must be unique)
            throw new IllegalArgumentException("Email already registered: " + request.email());
        }

        // Make a new empty user
        User user = new User();
        // Set the email
        user.setEmail(request.email());
        // Hash the password so we never save the real one
        user.setPassword(passwordEncoder.encode(request.password()));
        // Use the given role, or DEVELOPER if none was given
        user.setRole(request.role() != null ? request.role() : Role.DEVELOPER);
        // Set the team
        user.setTeamId(request.teamId());

        // Save the user in the database
        userRepository.save(user);

        // Make tokens so the user is logged in right away
        return buildAuthResponse(user);
    }

    // If anything fails, undo all database changes made in this method
    @Transactional
    // Check the email and password and give back tokens
    public AuthResponse login(LoginRequest request) {
        // Throws BadCredentialsException if invalid — Spring Security handles the 401
        authenticationManager.authenticate(
                // Give it the email and password to check
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        // Get the user from the database because we need their id and role
        User user = userRepository.findByEmail(request.email())
                // This should never happen because the login check just passed
                .orElseThrow(() -> new IllegalStateException("User not found after successful auth"));

        // Make tokens for this user
        return buildAuthResponse(user);
    }

    // If anything fails, undo all database changes made in this method
    @Transactional
    // Trade a refresh token for a new access token
    public AuthResponse refresh(RefreshRequest request) {
        // Look for the refresh token in the database
        RefreshToken stored = refreshTokenRepository.findByToken(request.refreshToken())
                // If it is not there, it is fake or was already used
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));

        // Check if the token is too old
        if (stored.getExpiresAt().isBefore(LocalDateTime.now())) {
            // Delete the old token to keep the table clean
            refreshTokenRepository.delete(stored);
            // Tell the user to log in again
            throw new IllegalArgumentException("Refresh token expired — please log in again");
        }

        // Find the user who owns the token
        User user = userRepository.findById(stored.getUserId())
                // The user may have been deleted
                .orElseThrow(() -> new IllegalStateException("User not found"));

        // Rotate the refresh token on each use (more secure)
        // Delete the used token so it can't be used again
        refreshTokenRepository.delete(stored);
        // Make new tokens
        return buildAuthResponse(user);
    }

    // Get info about the logged-in user
    public UserResponse getMe(String email) {
        // Find the user by email
        User user = userRepository.findByEmail(email)
                // If missing, tell the caller
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Build a response without the password
        return new UserResponse(user.getId(), user.getEmail(), user.getRole(),
                // Also include the team and the created time
                user.getTeamId(), user.getCreatedAt());
    }

    // Creates access JWT + stores a new refresh token in DB, returns both
    // We keep this in one place so register, login and refresh all work the same
    private AuthResponse buildAuthResponse(User user) {
        // Make the short-lived access token
        String accessToken = jwtService.generateAccessToken(user);

        // Delete any existing refresh tokens for this user, then create a fresh one
        // This way each user only has one refresh token at a time
        refreshTokenRepository.deleteByUserId(user.getId());

        // Make a new refresh token row
        RefreshToken refreshToken = new RefreshToken();
        // Say who owns it
        refreshToken.setUserId(user.getId());
        // Use a random UUID as the token text (nobody can guess it)
        refreshToken.setToken(UUID.randomUUID().toString());
        // Work out when it expires (milliseconds divided by 1000 gives seconds)
        refreshToken.setExpiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpirationMs / 1000));
        // Save it so we can check it later
        refreshTokenRepository.save(refreshToken);

        // Send both tokens back
        return new AuthResponse(
                // The access token
                accessToken,
                // The refresh token
                refreshToken.getToken(),
                // The token type
                "Bearer",
                // How many seconds the access token lasts
                accessTokenExpirationMs / 1000
        );
    }
}
