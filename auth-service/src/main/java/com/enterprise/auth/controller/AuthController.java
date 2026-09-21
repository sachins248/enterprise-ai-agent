// This file belongs to the controller package (web endpoints)
package com.enterprise.auth.controller;

// Import all the request and response classes
import com.enterprise.auth.dto.*;
// The service that does the real work
import com.enterprise.auth.service.AuthService;
// Lets us pick HTTP status codes like 201
import org.springframework.http.HttpStatus;
// Lets us build a full HTTP response
import org.springframework.http.ResponseEntity;
// Gets the logged-in user for us
import org.springframework.security.core.annotation.AuthenticationPrincipal;
// The type Spring uses for the logged-in user
import org.springframework.security.core.userdetails.UserDetails;
// Import the web annotations like @GetMapping
import org.springframework.web.bind.annotation.*;

// We use Map to build a small JSON error
import java.util.Map;

// Says this class answers web requests and returns JSON
@RestController
// All endpoints in this class start with /auth
@RequestMapping("/auth")
// This class has the login, register, refresh and "me" endpoints
public class AuthController {

    // The service that does the real work
    private final AuthService authService;

    // Spring gives us the service when it creates this class
    public AuthController(AuthService authService) {
        // Save the service so the methods below can use it
        this.authService = authService;
    }

    // Runs when someone sends POST /auth/register
    @PostMapping("/register")
    // Read the JSON body as a RegisterRequest
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        // Send back 201 (Created) and the tokens
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    // Runs when someone sends POST /auth/login
    @PostMapping("/login")
    // Read the JSON body as a LoginRequest
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        // Send back 200 (OK) and the tokens
        return ResponseEntity.ok(authService.login(request));
    }

    // Runs when someone sends POST /auth/refresh
    @PostMapping("/refresh")
    // Read the JSON body as a RefreshRequest
    public ResponseEntity<AuthResponse> refresh(@RequestBody RefreshRequest request) {
        // Send back 200 (OK) and new tokens
        return ResponseEntity.ok(authService.refresh(request));
    }

    // Runs when someone sends GET /auth/me
    @GetMapping("/me")
    // Spring gives us the user who is logged in
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal UserDetails userDetails) {
        // Look up that user by email and send back their info
        return ResponseEntity.ok(authService.getMe(userDetails.getUsername()));
    }

    // Global error handler for this controller
    // Runs when any method above throws IllegalArgumentException
    @ExceptionHandler(IllegalArgumentException.class)
    // Turn the error into a clean response
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException e) {
        // Send 400 (Bad Request) with the error message as JSON
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
}
