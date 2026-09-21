// This file belongs to the security package
package com.enterprise.auth.security;

// We need the User class to read the email, id and role
import com.enterprise.auth.entity.User;
// The data stored inside a token
import io.jsonwebtoken.Claims;
// The main tool to build and read tokens
import io.jsonwebtoken.Jwts;
// Helps us make a signing key
import io.jsonwebtoken.security.Keys;
// Lets us read values from application.properties
import org.springframework.beans.factory.annotation.Value;
// The type for a user
import org.springframework.security.core.userdetails.UserDetails;
// Marks this class as a service
import org.springframework.stereotype.Service;

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

// Marks this class as a service so Spring can create it
@Service
// This class makes tokens and reads tokens
public class JwtService {

    // Read the secret from application.properties (so it is not in the code)
    @Value("${jwt.secret}")
    // The secret text used to sign tokens
    private String secretKey;

    // Read the token lifetime from application.properties
    @Value("${jwt.access-token.expiration-ms}")
    // How long an access token lasts, in milliseconds
    private long accessTokenExpiration;

    /**
     * Derives a 256-bit signing key from the secret string using SHA-256.
     * This means any secret string length works — short secrets are fine.
     */
    // Makes the key we use to sign and check tokens
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

    // Make a signed access token for a user
    public String generateAccessToken(User user) {
        // Start building the token
        return Jwts.builder()
                // Who the token is for (the email)
                .subject(user.getEmail())
                // Add the user id so other services can read it
                .claim("userId", user.getId().toString())
                // Add the role so other services know what the user can do
                .claim("role", user.getRole().name())
                // When the token was made
                .issuedAt(new Date())
                // When the token stops working
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiration))
                // Sign it so nobody can change it without us noticing
                .signWith(getSigningKey())
                // Turn it into the final text
                .compact();
    }

    // Get the email from a token
    public String extractUsername(String token) {
        // The email is stored as the "subject"
        return extractClaim(token, Claims::getSubject);
    }

    // Get the user id from a token
    public String extractUserId(String token) {
        // Read our custom "userId" value
        return extractClaim(token, claims -> claims.get("userId", String.class));
    }

    // Get the role from a token
    public String extractRole(String token) {
        // Read our custom "role" value
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    // Check that a token belongs to this user and is not expired
    public boolean isTokenValid(String token, UserDetails userDetails) {
        // Get the email from the token
        final String username = extractUsername(token);
        // The emails must match and the token must not be expired
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    // Check if the token is too old
    private boolean isTokenExpired(String token) {
        // Expired means the expiry time is before now
        return extractExpiration(token).before(new Date());
    }

    // Get the expiry time from a token
    private Date extractExpiration(String token) {
        // The expiry time is a standard value in every token
        return extractClaim(token, Claims::getExpiration);
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
