// This file belongs to the main agent package
package com.enterprise.agent;

// We need this to start the app
import org.springframework.boot.SpringApplication;
// This one marks the class as a Spring Boot app
import org.springframework.boot.autoconfigure.SpringBootApplication;

// Tells Spring Boot to set everything up automatically
@SpringBootApplication
// This is the main class of the agent service (the AI part of the app)
public class AgentServiceApplication {
    // Java runs this method first when the service starts
    public static void main(String[] args) {
        // Start the Spring app so the agent service begins listening for requests
        SpringApplication.run(AgentServiceApplication.class, args);
    }
}
