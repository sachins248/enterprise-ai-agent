// This file belongs to the main gateway package
package com.enterprise.gateway;

// We need this to start the app
import org.springframework.boot.SpringApplication;
// This one marks the class as a Spring Boot app
import org.springframework.boot.autoconfigure.SpringBootApplication;

// Tells Spring Boot to set everything up automatically
@SpringBootApplication
// This is the main class of the gateway (the front door for all requests)
public class GatewayServiceApplication {
    // Java runs this method first when the service starts
    public static void main(String[] args) {
        // Start the Spring app so the gateway begins listening for requests
        SpringApplication.run(GatewayServiceApplication.class, args);
    }
}
