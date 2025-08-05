package com.apitester.wrapper.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class AppConfig {

    @Value("${app.environment:production}")
    private String environment;

    @Value("${app.server.port:3001}")
    private int port;

    @Value("${app.server.ip.development:localhost}")
    private String developmentServerIP;

    @Value("${app.server.ip.production:192.168.120.4}")
    private String productionServerIP;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        if ("development".equals(environment)) {
            configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:8080",
                "http://localhost:8081", 
                "http://localhost:8082",
                "http://localhost:3000"
            ));
        } else {
            configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        }
        
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Content-Type", "Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    public String getEnvironment() {
        return environment;
    }

    public int getPort() {
        return port;
    }

    public String getServerIP() {
        return "development".equals(environment) ? developmentServerIP : productionServerIP;
    }

    public List<String> getBlockedHosts() {
        List<String> blockedHosts = Arrays.asList("127.0.0.1");
        if ("development".equals(environment)) {
            blockedHosts = Arrays.asList("127.0.0.1", "localhost");
        } else {
            blockedHosts = Arrays.asList("127.0.0.1", "10.106.246.81");
        }
        return blockedHosts;
    }
} 