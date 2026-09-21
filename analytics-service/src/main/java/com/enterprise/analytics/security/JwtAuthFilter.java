// This file belongs to the security package
package com.enterprise.analytics.security;

// The chain of filters a request goes through
import jakarta.servlet.FilterChain;
// The error a filter can throw
import jakarta.servlet.ServletException;
// The incoming web request
import jakarta.servlet.http.HttpServletRequest;
// The outgoing web response
import jakarta.servlet.http.HttpServletResponse;
// Marks a value as "never null"
import org.springframework.lang.NonNull;
// The object that says "this user is logged in"
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
// A simple ready-made permission type
import org.springframework.security.core.authority.SimpleGrantedAuthority;
// The place where Spring keeps the current login
import org.springframework.security.core.context.SecurityContextHolder;
// Adds request info (like IP address) to the login
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
// Makes this class a Spring-managed object
import org.springframework.stereotype.Component;
// A filter that runs exactly once per request
import org.springframework.web.filter.OncePerRequestFilter;

// Used for the error our filter method can throw
import java.io.IOException;
// Used to make a small list
import java.util.List;

// Makes this class a Spring-managed object
@Component
// This filter checks the JWT on every request and logs the user in
public class JwtAuthFilter extends OncePerRequestFilter {

    // Reads and checks tokens
    private final JwtUtil jwtUtil;

    // Spring gives us the helper when it creates this class
    public JwtAuthFilter(JwtUtil jwtUtil) {
        // Save the helper
        this.jwtUtil = jwtUtil;
    }

    // This runs once for every request
    @Override
    protected void doFilterInternal(
            // The request coming in
            @NonNull HttpServletRequest request,
            // The response going out
            @NonNull HttpServletResponse response,
            // The rest of the filters
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // Read the Authorization header (it should look like "Bearer <token>")
        final String authHeader = request.getHeader("Authorization");

        // If there is no Bearer token, skip this filter
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // Pass the request on without logging anyone in
            filterChain.doFilter(request, response);
            // Stop here
            return;
        }

        // Cut off the first 7 characters ("Bearer ") to get just the token
        final String jwt = authHeader.substring(7);

        // Wrap in try because a bad token throws an error
        try {
            // If the token is fake or expired, don't log anyone in
            if (!jwtUtil.isTokenValid(jwt)) {
                // Pass the request on without logging anyone in
                filterChain.doFilter(request, response);
                // Stop here
                return;
            }

            // Read the email out of the token
            String email = jwtUtil.extractUsername(jwt);
            String role = jwtUtil.extractRole(jwt);  // "ADMIN", "DEVELOPER", or "VIEWER"

            // Only log in if we have an email and nobody is logged in yet
            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // Spring expects role names to start with ROLE_
                var authority = new SimpleGrantedAuthority("ROLE_" + role);
                // Make a "this user is logged in" object with their permission
                var authToken = new UsernamePasswordAuthenticationToken(
                        // No password needed, the token already proved it
                        email, null, List.of(authority)
                );
                // Attach request info like the IP address
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                // Tell Spring this user is now logged in for this request
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (Exception ignored) {
            // Invalid token — leave SecurityContext empty, Spring Security returns 401
        }

        // Pass the request on to the next filter
        filterChain.doFilter(request, response);
    }
}
