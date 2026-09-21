// This file belongs to the main auth package
package com.enterprise.auth;

// We need this to start the app
import org.springframework.boot.SpringApplication;
// This one marks the class as a Spring Boot app
import org.springframework.boot.autoconfigure.SpringBootApplication;

// Tells Spring Boot to set everything up automatically
@SpringBootApplication
// This is the main class of the auth service
public class AuthServiceApplication {
    // Java runs this method first when the service starts
    public static void main(String[] args) {
        // Start the Spring app so the auth service begins listening for requests
        SpringApplication.run(AuthServiceApplication.class, args);
    }
}
