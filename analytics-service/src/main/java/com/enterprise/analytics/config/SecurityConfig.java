// This file belongs to the config package (settings)
package com.enterprise.analytics.config;

// Our filter that reads the JWT from each request
import com.enterprise.analytics.security.JwtAuthFilter;
// Lets us make Spring-managed objects with @Bean
import org.springframework.context.annotation.Bean;
// Says this class holds settings
import org.springframework.context.annotation.Configuration;
// Turns on @PreAuthorize
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
// Lets us set the security rules
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
// Turns on web security
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
// Helps us turn off features like CSRF
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
// Lets us say "no sessions"
import org.springframework.security.config.http.SessionCreationPolicy;
// The chain of security checks each request goes through
import org.springframework.security.web.SecurityFilterChain;
// The normal login filter (we put our filter before it)
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

// Says this class holds settings
@Configuration
// Turns on web security
@EnableWebSecurity
@EnableMethodSecurity  // enables @PreAuthorize("hasRole('ADMIN')") on controller methods
// This class sets up all the security rules for the analytics service
public class SecurityConfig {

    // Our JWT filter
    private final JwtAuthFilter jwtAuthFilter;

    // Spring gives us the filter when it creates this class
    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        // Save the filter
        this.jwtAuthFilter = jwtAuthFilter;
    }

    // Spring uses this object as the main set of security rules
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // Start setting up the rules
        http
            // Turn off CSRF because we use tokens, not browser cookies
            .csrf(AbstractHttpConfigurer::disable)
            // Now decide which URLs need a login
            .authorizeHttpRequests(auth -> auth
                // Anyone can see health checks (Docker needs this)
                .requestMatchers("/actuator/**").permitAll()
                // Everything else needs a login
                .anyRequest().authenticated()
            )
            // Now decide how sessions work
            .sessionManagement(session -> session
                // No HTTP session, JWT only
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            // Run our JWT filter before the normal login filter
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        // Finish and return the rules
        return http.build();
    }
}
