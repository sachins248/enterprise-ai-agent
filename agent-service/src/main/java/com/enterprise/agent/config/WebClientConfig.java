// This file belongs to the config package (settings)
package com.enterprise.agent.config;

// Lets us make Spring-managed objects with @Bean
import org.springframework.context.annotation.Bean;
// Says this class holds settings
import org.springframework.context.annotation.Configuration;
// The tool we use to call other web services (like Gemini) without blocking
import org.springframework.web.reactive.function.client.WebClient;

// Says this class holds settings
@Configuration
// This class sets up the WebClient we use to call the Gemini API
public class WebClientConfig {

    // Spring keeps this object and gives it to any class that asks for a WebClient
    @Bean
    public WebClient webClient() {
        // Start building a WebClient
        return WebClient.builder()
                // No base URL — GeminiService sets the full URI per call
                // Allow answers up to 10 MB in memory (the default is too small for big answers)
                .codecs(config -> config.defaultCodecs().maxInMemorySize(10 * 1024 * 1024)) // 10 MB buffer
                // Finish and return the WebClient
                .build();
    }
}
