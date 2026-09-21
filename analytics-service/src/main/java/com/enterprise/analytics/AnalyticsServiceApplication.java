// This file belongs to the main analytics package
package com.enterprise.analytics;

// We need this to start the app
import org.springframework.boot.SpringApplication;
// This one marks the class as a Spring Boot app
import org.springframework.boot.autoconfigure.SpringBootApplication;

// Tells Spring Boot to set everything up automatically
@SpringBootApplication
// This is the main class of the analytics service (it counts usage and makes reports)
public class AnalyticsServiceApplication {
    // Java runs this method first when the service starts
    public static void main(String[] args) {
        // Start the Spring app so the analytics service begins running
        SpringApplication.run(AnalyticsServiceApplication.class, args);
    }
}
