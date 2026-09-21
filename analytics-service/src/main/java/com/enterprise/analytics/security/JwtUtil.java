// This file belongs to the security package
package com.enterprise.analytics.security;

// The data stored inside a token
import io.jsonwebtoken.Claims;
// The main tool to read tokens
import io.jsonwebtoken.Jwts;
// Helps us make a signing key
import io.jsonwebtoken.security.Keys;
// Lets us read values from application.properties
import org.springframework.beans.factory.annotation.Value;
// Makes this class a Spring-managed object
import org.springframework.stereotype.Component;

// The type for the secret key
import javax.crypto.SecretKey;
// Used to turn text into bytes
import java.nio.charset.StandardCharsets;
// Used to hash text
import java.security.MessageDigest;
// The error hashing can throw
import java.security.NoSuchAlgorithmException;
// A type for dates
import java.util.Date;
// Lets us pass a small function as a value
import java.util.function.Function;

// Makes this class a Spring-managed object
@Component
// Reads and checks tokens (this service never makes tokens, only reads them)
public class JwtUtil {

    // Read the secret from application.properties (it must match the auth service)
    @Value("${jwt.secret}")
    // The secret text used to check token signatures
    private String secretKey;

    // Makes the key we use to check tokens (same steps as the auth service)
    private SecretKey getSigningKey() {
        // Hashing can throw an error, so we use try
        try {
            // Get a SHA-256 hasher (its output is always 32 bytes)
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            // Hash the secret so the key is always the right length
            byte[] hash = digest.digest(secretKey.getBytes(StandardCharsets.UTF_8));
            // Turn the bytes into a signing key
            return Keys.hmacShaKeyFor(hash);
        } catch (NoSuchAlgorithmException e) {
            // Java always has SHA-256, so this should never happen
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    // Get the email from a token
    public String extractUsername(String token) {
        // The email is stored as the "subject"
        return extractClaim(token, Claims::getSubject);
    }

    // Get the user id from a token
    public String extractUserId(String token) {
        // Read our custom "userId" value
        return extractClaim(token, c -> c.get("userId", String.class));
    }

    // Get the role from a token
    public String extractRole(String token) {
        // Read our custom "role" value
        return extractClaim(token, c -> c.get("role", String.class));
    }

    // Check that the token is real and not expired
    public boolean isTokenValid(String token) {
        // A bad token throws an error, so we use try
        try {
            // Valid means the expiry time is not before now
            return !extractClaim(token, Claims::getExpiration).before(new Date());
        } catch (Exception e) {
            // Any error means the token is not valid
            return false;
        }
    }

    // One shared method that reads any value from a token
    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        // Read the token and check its signature at the same time
        Claims claims = Jwts.parser()
                // Use our key to check the signature
                .verifyWith(getSigningKey())
                // Finish setting up the reader
                .build()
                // Read the token (fails if it was changed or is not signed)
                .parseSignedClaims(token)
                // Get the data inside the token
                .getPayload();
        // Pick out the one value the caller wants
        return resolver.apply(claims);
    }
}
