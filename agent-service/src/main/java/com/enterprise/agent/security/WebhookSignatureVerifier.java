package com.enterprise.agent.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

/**
 * Verifies GitHub webhook payloads using HMAC-SHA256.
 *
 * GitHub signs every webhook payload with your secret using HMAC-SHA256
 * and puts the result in the X-Hub-Signature-256 header as "sha256=<hex>".
 * We recompute the HMAC locally and compare — if they match, the payload
 * is genuinely from GitHub (not a spoofed request from anyone else).
 */
@Component
public class WebhookSignatureVerifier {

    @Value("${github.webhook.secret:}")
    private String webhookSecret;

    /**
     * Returns true if:
     *   - No webhook secret is configured (open mode — fine for local dev)
     *   - The signature header matches HMAC-SHA256(secret, payload)
     *
     * Returns false if a secret is configured but the signature is wrong/missing.
     */
    public boolean isValid(String signatureHeader, String payload) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            return true;  // no secret configured — skip verification
        }

        if (signatureHeader == null || !signatureHeader.startsWith("sha256=")) {
            return false;
        }

        String expected = "sha256=" + computeHmacSha256(webhookSecret, payload);
        return constantTimeEquals(expected, signatureHeader);
    }

    private String computeHmacSha256(String secret, String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            // Convert bytes to hex string
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException("HMAC-SHA256 computation failed", e);
        }
    }

    /**
     * Constant-time comparison to prevent timing attacks.
     * A normal string.equals() returns early on first mismatch —
     * an attacker could measure response times to guess the secret byte-by-byte.
     */
    private boolean constantTimeEquals(String a, String b) {
        if (a.length() != b.length()) return false;
        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        return result == 0;
    }
}
