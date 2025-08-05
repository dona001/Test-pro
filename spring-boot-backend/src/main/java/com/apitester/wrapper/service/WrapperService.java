package com.apitester.wrapper.service;

import com.apitester.wrapper.model.WrapperRequest;
import com.apitester.wrapper.model.WrapperResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.restassured.RestAssured;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import static io.restassured.RestAssured.given;

@Service
public class WrapperService {

    private static final Logger logger = LoggerFactory.getLogger(WrapperService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    public WrapperService() {
        // Configure RestAssured defaults
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();
        RestAssured.config().getLogConfig().enableLoggingOfRequestAndResponseIfValidationFails();
    }

    public WrapperResponse processRequest(WrapperRequest request) {
        long startTime = System.currentTimeMillis();
        
        try {
            logger.info("🌐 API Wrapper: {} request to: {}", request.getMethod(), request.getUrl());
            logger.info("📋 Request headers: {}", request.getHeaders());
            logger.info("📦 Request body: {}", request.getBody());

            // Build RestAssured request
            RequestSpecification requestSpec = given()
                .config(RestAssured.config().logConfig(RestAssured.config().getLogConfig().enableLoggingOfRequestAndResponseIfValidationFails()))
                .relaxedHTTPSValidation(); // Allow self-signed certificates

            // Add default headers
            requestSpec.header("User-Agent", "API-Tester-Pro-Wrapper/1.0.0");
            requestSpec.header("Accept", "*/*");
            requestSpec.header("Accept-Encoding", "gzip, deflate, br");
            requestSpec.header("Connection", "keep-alive");
            requestSpec.header("Cache-Control", "no-cache");

            // Add custom headers if provided
            if (request.getHeaders() != null) {
                request.getHeaders().forEach(requestSpec::header);
            }

            // Add body for methods that support it
            if (isBodySupported(request.getMethod()) && request.getBody() != null) {
                requestSpec.body(request.getBody());
            }

            // Execute the request
            Response response = requestSpec
                .when()
                .request(request.getMethod().toUpperCase(), request.getUrl())
                .then()
                .extract()
                .response();

            long endTime = System.currentTimeMillis();
            long responseTime = endTime - startTime;

            logger.info("✅ API Wrapper successful: {} ({}ms) - Target URL: {}", 
                response.getStatusCode(), responseTime, request.getUrl());

            // Extract response headers
            Map<String, String> responseHeaders = new HashMap<>();
            response.getHeaders().forEach(header -> {
                String key = header.getName();
                String value = header.getValue();
                if (!key.toLowerCase().matches("content-encoding|transfer-encoding|connection")) {
                    responseHeaders.put(key, value);
                }
            });

            // Get response body
            Object responseBody;
            try {
                // Try to parse as JSON first
                responseBody = objectMapper.readValue(response.getBody().asString(), Object.class);
            } catch (Exception e) {
                // If not JSON, return as string
                responseBody = response.getBody().asString();
            }

            // Create wrapper info
            WrapperResponse.WrapperInfo wrapperInfo = new WrapperResponse.WrapperInfo(
                Instant.now().toString(),
                responseTime,
                request.getUrl(),
                request.getMethod().toUpperCase()
            );

            return new WrapperResponse(
                true,
                response.getStatusCode(),
                "OK",
                responseHeaders,
                responseBody,
                wrapperInfo
            );

        } catch (Exception e) {
            long endTime = System.currentTimeMillis();
            long responseTime = endTime - startTime;

            logger.error("❌ API Wrapper error: {} - Target URL: {}", e.getMessage(), request.getUrl());

            // Handle different types of errors
            int statusCode = 500;
            String errorMessage = e.getMessage();

            if (e.getMessage().contains("Name or service not known")) {
                statusCode = 404;
                errorMessage = "Target URL not found";
            } else if (e.getMessage().contains("Connection refused")) {
                statusCode = 503;
                errorMessage = "Connection refused by target server";
            } else if (e.getMessage().contains("timeout")) {
                statusCode = 504;
                errorMessage = "Request timeout";
            } else if (e.getMessage().contains("SSL")) {
                statusCode = 495;
                errorMessage = "SSL/TLS error";
            } else if (e.getMessage().contains("401")) {
                statusCode = 401;
                errorMessage = "Unauthorized";
            } else if (e.getMessage().contains("403")) {
                statusCode = 403;
                errorMessage = "Forbidden";
            } else if (e.getMessage().contains("404")) {
                statusCode = 404;
                errorMessage = "Not Found";
            } else if (e.getMessage().contains("500")) {
                statusCode = 502;
                errorMessage = "Bad Gateway";
            }

            Map<String, Object> errorData = new HashMap<>();
            errorData.put("error", "API Wrapper request failed");
            errorData.put("message", errorMessage);
            errorData.put("status", statusCode);
            errorData.put("timestamp", Instant.now().toString());
            errorData.put("targetUrl", request.getUrl());
            errorData.put("originalError", e.getMessage());

            WrapperResponse.WrapperInfo wrapperInfo = new WrapperResponse.WrapperInfo(
                Instant.now().toString(),
                responseTime,
                request.getUrl(),
                request.getMethod().toUpperCase()
            );

            return new WrapperResponse(
                false,
                statusCode,
                "Error",
                new HashMap<>(),
                errorData,
                wrapperInfo
            );
        }
    }

    private boolean isBodySupported(String method) {
        return "POST".equalsIgnoreCase(method) || 
               "PUT".equalsIgnoreCase(method) || 
               "PATCH".equalsIgnoreCase(method) || 
               "DELETE".equalsIgnoreCase(method);
    }
} 