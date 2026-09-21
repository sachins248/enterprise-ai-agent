// This file belongs to the main audit package
package com.enterprise.audit;

// We need this to start the app
import org.springframework.boot.SpringApplication;
// This one marks the class as a Spring Boot app
import org.springframework.boot.autoconfigure.SpringBootApplication;

// Tells Spring Boot to set everything up automatically
@SpringBootApplication
// This is the main class of the audit service (it keeps a record of what users do)
public class AuditServiceApplication {
    // Java runs this method first when the service starts
    public static void main(String[] args) {
        // Start the Spring app so the audit service begins running
        SpringApplication.run(AuditServiceApplication.class, args);
    }
}
