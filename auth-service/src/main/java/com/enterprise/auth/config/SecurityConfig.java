// This file belongs to the config package (settings)
package com.enterprise.auth.config;

// We need the user database access
import com.enterprise.auth.repository.UserRepository;
// Our filter that reads the JWT from each request
import com.enterprise.auth.security.JwtAuthFilter;
// Lets us make Spring-managed objects with @Bean
import org.springframework.context.annotation.Bean;
// Says this class holds settings
import org.springframework.context.annotation.Configuration;
// Checks logins
import org.springframework.security.authentication.AuthenticationManager;
// Describes how to check a login
import org.springframework.security.authentication.AuthenticationProvider;
// A ready-made provider that checks a database user
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
// Gives us the default AuthenticationManager
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
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
// Loads a user by name
import org.springframework.security.core.userdetails.UserDetailsService;
// The error for "user not found"
import org.springframework.security.core.userdetails.UsernameNotFoundException;
// Hashes passwords with BCrypt
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
// The general type for a password hasher
import org.springframework.security.crypto.password.PasswordEncoder;
// The chain of security checks each request goes through
import org.springframework.security.web.SecurityFilterChain;
// The normal login filter (we put our filter before it)
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

// Says this class holds settings
@Configuration
// Turns on web security
@EnableWebSecurity
@EnableMethodSecurity  // enables @PreAuthorize on controller methods
// This class sets up all the security rules for the auth service
public class SecurityConfig {

    // Our JWT filter
    private final JwtAuthFilter jwtAuthFilter;
    // Used to find users
    private final UserRepository userRepository;

    // Spring gives us these two when it creates this class
    public SecurityConfig(JwtAuthFilter jwtAuthFilter, UserRepository userRepository) {
        // Save the filter
        this.jwtAuthFilter = jwtAuthFilter;
        // Save the repository
        this.userRepository = userRepository;
    }

    // Spring uses this object as the main set of security rules
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // Start setting up the rules
        http
            .csrf(AbstractHttpConfigurer::disable)  // stateless API — no CSRF needed
            // Now decide which URLs need a login
            .authorizeHttpRequests(auth -> auth
                // Anyone can register, log in and refresh (they don't have a token yet)
                .requestMatchers("/auth/register", "/auth/login", "/auth/refresh").permitAll()
                // Anyone can see health checks (Docker needs this)
                .requestMatchers("/actuator/**").permitAll()
                // Everything else needs a login
                .anyRequest().authenticated()
            )
            // Now decide how sessions work
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)  // no HTTP session, JWT only
            )
            // Tell Spring how to check logins
            .authenticationProvider(authenticationProvider())
            // Run our JWT filter before the normal login filter
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        // Finish and return the rules
        return http.build();
    }

    // Tells Spring how to load a user
    @Bean
    public UserDetailsService userDetailsService() {
        // Look the user up by email
        return username -> userRepository.findByEmail(username)
                // If we can't find them, say so
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    // Tells Spring how to check an email and password
    @Bean
    public AuthenticationProvider authenticationProvider() {
        // A ready-made provider that checks the database
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        // How to find the user
        provider.setUserDetailsService(userDetailsService());
        // How to check the password hash
        provider.setPasswordEncoder(passwordEncoder());
        // Give it back to Spring
        return provider;
    }

    // The object that runs the login check (used by AuthService)
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        // Use the default one Spring already built
        return config.getAuthenticationManager();
    }

    // The password hasher used everywhere in this service
    @Bean
    public PasswordEncoder passwordEncoder() {
        // BCrypt is slow on purpose, which makes password guessing harder
        return new BCryptPasswordEncoder();
    }
}
