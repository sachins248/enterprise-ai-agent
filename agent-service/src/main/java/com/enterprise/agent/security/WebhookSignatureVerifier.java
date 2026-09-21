// This file belongs to the security package
package com.enterprise.agent.security;

// Lets us read values from application.properties
import org.springframework.beans.factory.annotation.Value;
// Makes this class a Spring-managed object
import org.springframework.stereotype.Component;

// The tool that makes HMAC signatures
import javax.crypto.Mac;
// Holds the secret key for the HMAC tool
import javax.crypto.spec.SecretKeySpec;
// Used to turn text into bytes
import java.nio.charset.StandardCharsets;

/**
 * Verifies GitHub webhook payloads using HMAC-SHA256.
 *
 * GitHub signs every webhook payload with your secret using HMAC-SHA256
 * and puts the result in the X-Hub-Signature-256 header as "sha256=<hex>".
 * We recompute the HMAC locally and compare — if they match, the payload
 * is genuinely from GitHub (not a spoofed request from anyone else).
 */
// Makes this class a Spring-managed object
@Component
// This class checks that a webhook really came from GitHub
public class WebhookSignatureVerifier {

    // Read the secret from application.properties (empty if not set)
    @Value("${github.webhook.secret:}")
    // The secret we share with GitHub
    private String webhookSecret;

    /**
     * Returns true if:
     *   - No webhook secret is configured (open mode — fine for local dev)
     *   - The signature header matches HMAC-SHA256(secret, payload)
     *
     * Returns false if a secret is configured but the signature is wrong/missing.
     */
    // Says if the webhook is trusted or not
    public boolean isValid(String signatureHeader, String payload) {
        // If there is no secret, we can't check anything
        if (webhookSecret == null || webhookSecret.isBlank()) {
            return true;  // no secret configured — skip verification
        }

        // If the header is missing or in the wrong format, don't trust it
        if (signatureHeader == null || !signatureHeader.startsWith("sha256=")) {
            // Reject the request
            return false;
        }

        // Work out what the signature should be
        String expected = "sha256=" + computeHmacSha256(webhookSecret, payload);
        // Compare it to the one GitHub sent
        return constantTimeEquals(expected, signatureHeader);
    }

    // Makes the HMAC-SHA256 signature for some text, as a hex string
    private String computeHmacSha256(String secret, String payload) {
        // The HMAC tool can throw errors, so we use try
        try {
            // Get an HMAC-SHA256 tool
            Mac mac = Mac.getInstance("HmacSHA256");
            // Give it our secret
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            // Make the signature bytes from the payload
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            // Convert bytes to hex string
            // A StringBuilder lets us add text piece by piece
            StringBuilder hex = new StringBuilder();
            // Go through each byte
            for (byte b : hash) {
                // Turn the byte into two hex letters (like "0f") and add it
                hex.append(String.format("%02x", b));
            }
            // Return the full hex text
            return hex.toString();
        } catch (Exception e) {
            // If anything goes wrong, stop with a clear message
            throw new RuntimeException("HMAC-SHA256 computation failed", e);
        }
    }

    /**
     * Constant-time comparison to prevent timing attacks.
     * A normal string.equals() returns early on first mismatch —
     * an attacker could measure response times to guess the secret byte-by-byte.
     */
    // Compares two texts in a way that always takes the same time
    private boolean constantTimeEquals(String a, String b) {
        // Different lengths can never match
        if (a.length() != b.length()) return false;
        // This starts at 0 and becomes non-zero if any letter is different
        int result = 0;
        // Check every letter, even after finding a difference
        for (int i = 0; i < a.length(); i++) {
            // XOR is 0 for equal letters; OR keeps any difference we find
            result |= a.charAt(i) ^ b.charAt(i);
        }
        // Zero means every letter matched
        return result == 0;
    }
}
