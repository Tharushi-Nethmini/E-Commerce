package com.ecommerce.inventory.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // Swagger & actuator - public
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/actuator/**").permitAll()
                // Read products - public (anyone can browse)
                .requestMatchers(HttpMethod.GET, "/api/inventory/products/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/inventory/products").permitAll()
                // Inter-service stock operations - public (called by order-service without user token)
                .requestMatchers("/api/inventory/check-stock").permitAll()
                .requestMatchers("/api/inventory/reserve-stock").permitAll()
                .requestMatchers("/api/inventory/confirm-stock").permitAll()
                .requestMatchers("/api/inventory/release-stock").permitAll()
                // ADMIN only: create, update, delete products
                .requestMatchers(HttpMethod.POST, "/api/inventory/products").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/inventory/products/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/inventory/products/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
