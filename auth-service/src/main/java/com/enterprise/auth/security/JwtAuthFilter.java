// This file belongs to the security package
package com.enterprise.auth.security;

// We need this to look up the user
import com.enterprise.auth.repository.UserRepository;
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
// The place where Spring keeps the current login
import org.springframework.security.core.context.SecurityContextHolder;
// The type for a user
import org.springframework.security.core.userdetails.UserDetails;
// Adds request info (like IP address) to the login
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
// Makes this class a Spring-managed object
import org.springframework.stereotype.Component;
// A filter that runs exactly once per request
import org.springframework.web.filter.OncePerRequestFilter;

// Used for the error our filter method can throw
import java.io.IOException;

// Makes this class a Spring-managed object
@Component
// This filter checks the JWT on every request and logs the user in
public class JwtAuthFilter extends OncePerRequestFilter {

    // Used to read and check tokens
    private final JwtService jwtService;
    // Used to find the user
    private final UserRepository userRepository;

    // Spring gives us these two when it creates this class
    public JwtAuthFilter(JwtService jwtService, UserRepository userRepository) {
        // Save the token helper
        this.jwtService = jwtService;
        // Save the repository
        this.userRepository = userRepository;
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

        // If no Bearer token, skip filter — Spring Security will reject unauthorized requests
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
            // Read the email out of the token
            final String userEmail = jwtService.extractUsername(jwt);

            // Only authenticate if not already authenticated in this request
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // Find the user in the database (null if not found)
                UserDetails userDetails = userRepository.findByEmail(userEmail)
                        .orElse(null);

                // Only continue if the user exists and the token is valid for them
                if (userDetails != null && jwtService.isTokenValid(jwt, userDetails)) {
                    // Make a "this user is logged in" object with their permissions
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    // Who the user is
                                    userDetails,
                                    // No password needed, the token already proved it
                                    null,
                                    // What the user is allowed to do
                                    userDetails.getAuthorities()
                            );
                    // Attach request info like the IP address
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    // Tell Spring this user is now logged in for this request
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // Invalid/expired token — just don't set auth context, Spring Security handles the 401
        }

        // Pass the request on to the next filter
        filterChain.doFilter(request, response);
    }
}
