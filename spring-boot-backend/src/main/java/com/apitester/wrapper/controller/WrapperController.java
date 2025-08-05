package com.apitester.wrapper.controller;

import com.apitester.wrapper.config.AppConfig;
import com.apitester.wrapper.model.WrapperRequest;
import com.apitester.wrapper.model.WrapperResponse;
import com.apitester.wrapper.service.WrapperService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class WrapperController {

    private static final Logger logger = LoggerFactory.getLogger(WrapperController.class);

    @Autowired
    private WrapperService wrapperService;

    @Autowired
    private AppConfig appConfig;

    @PostMapping("/wrapper")
    public ResponseEntity<WrapperResponse> handleWrapperRequest(@Valid @RequestBody WrapperRequest request) {
        logger.info("🌐 API Wrapper: {} request to: {}", request.getMethod(), request.getUrl());
        logger.info("📋 Request headers: {}", request.getHeaders());
        logger.info("📦 Request body: {}", request.getBody());

        try {
            // Validate URL format
            URI targetUri = new URI(request.getUrl());
            String hostname = targetUri.getHost();

            // Check for blocked hosts
            if (appConfig.getBlockedHosts().contains(hostname)) {
                logger.warn("🚫 Blocked hostname: {}", hostname);
                return ResponseEntity.badRequest().body(createErrorResponse(
                    "Blocked hostname", 
                    String.format("Cannot proxy requests to %s for security reasons", hostname)
                ));
            }

            // Process the request
            WrapperResponse response = wrapperService.processRequest(request);
            return ResponseEntity.ok(response);

        } catch (URISyntaxException e) {
            logger.error("❌ Invalid URL format: {}", request.getUrl());
            return ResponseEntity.badRequest().body(createErrorResponse(
                "Invalid URL format", 
                "Please provide a valid URL"
            ));
        } catch (Exception e) {
            logger.error("❌ Wrapper error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(createErrorResponse(
                "API Wrapper request failed", 
                e.getMessage()
            ));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "OK");
        health.put("timestamp", Instant.now().toString());
        health.put("service", "CORS Wrapper Server");
        health.put("version", "1.0.0");
        health.put("environment", appConfig.getEnvironment());
        health.put("serverIP", appConfig.getServerIP());
        
        return ResponseEntity.ok(health);
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<Map<String, Object>> handleException(Exception e) {
        logger.error("Server error: ", e);
        
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("error", "Internal server error");
        error.put("message", "development".equals(appConfig.getEnvironment()) ? e.getMessage() : "Something went wrong");
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    private WrapperResponse createErrorResponse(String error, String message) {
        Map<String, Object> errorData = new HashMap<>();
        errorData.put("error", error);
        errorData.put("message", message);
        
        return new WrapperResponse(
            false, 
            400, 
            "Bad Request", 
            new HashMap<>(), 
            errorData, 
            new WrapperResponse.WrapperInfo(
                Instant.now().toString(), 
                0, 
                "", 
                ""
            )
        );
    }
} 