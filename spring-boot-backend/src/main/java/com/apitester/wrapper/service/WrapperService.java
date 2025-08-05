package com.apitester.wrapper.service;

import com.apitester.wrapper.model.WrapperRequest;
import com.apitester.wrapper.model.WrapperResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
public class WrapperService {

    private static final Logger logger = LoggerFactory.getLogger(WrapperService.class);

    @Autowired
    private WebClient webClient;

    public WrapperResponse processRequest(WrapperRequest request) {
        long startTime = System.currentTimeMillis();
        
        try {
            // Build headers
            HttpHeaders headers = new HttpHeaders();
            headers.add("User-Agent", "API-Tester-Pro-Wrapper/1.0.0");
            headers.add("Accept", "*/*");
            headers.add("Accept-Encoding", "gzip, deflate, br");
            headers.add("Connection", "keep-alive");
            headers.add("Cache-Control", "no-cache");

            // Add custom headers if provided
            if (request.getHeaders() != null) {
                request.getHeaders().forEach(headers::add);
            }

            // Build the request
            WebClient.RequestBodySpec requestSpec = webClient
                .method(HttpMethod.valueOf(request.getMethod().toUpperCase()))
                .uri(request.getUrl());

            // Add headers
            requestSpec.headers(httpHeaders -> httpHeaders.putAll(headers));

            // Add body for methods that support it
            WebClient.RequestHeadersSpec<?> finalRequest;
            if (isBodySupported(request.getMethod()) && request.getBody() != null) {
                finalRequest = requestSpec.bodyValue(request.getBody());
            } else {
                finalRequest = requestSpec;
            }

            // Execute the request
            var response = finalRequest
                .retrieve()
                .toEntity(Object.class)
                .block(Duration.ofSeconds(60));

            long endTime = System.currentTimeMillis();
            long responseTime = endTime - startTime;

            logger.info("✅ API Wrapper successful: {} ({}ms) - Target URL: {}", 
                response.getStatusCode(), responseTime, request.getUrl());

            // Extract response headers
            Map<String, String> responseHeaders = new HashMap<>();
            response.getHeaders().forEach((key, values) -> {
                if (!key.toLowerCase().matches("content-encoding|transfer-encoding|connection")) {
                    responseHeaders.put(key, String.join(", ", values));
                }
            });

            // Create wrapper info
            WrapperResponse.WrapperInfo wrapperInfo = new WrapperResponse.WrapperInfo(
                Instant.now().toString(),
                responseTime,
                request.getUrl(),
                request.getMethod().toUpperCase()
            );

            return new WrapperResponse(
                true,
                response.getStatusCode().value(),
                "OK",
                responseHeaders,
                response.getBody(),
                wrapperInfo
            );

        } catch (WebClientResponseException e) {
            long endTime = System.currentTimeMillis();
            long responseTime = endTime - startTime;

            logger.error("❌ API Wrapper error: {} - Target URL: {}", e.getMessage(), request.getUrl());

            // Extract response headers from error
            Map<String, String> responseHeaders = new HashMap<>();
            e.getHeaders().forEach((key, values) -> {
                if (!key.toLowerCase().matches("content-encoding|transfer-encoding|connection")) {
                    responseHeaders.put(key, String.join(", ", values));
                }
            });

            WrapperResponse.WrapperInfo wrapperInfo = new WrapperResponse.WrapperInfo(
                Instant.now().toString(),
                responseTime,
                request.getUrl(),
                request.getMethod().toUpperCase()
            );

            return new WrapperResponse(
                false,
                e.getStatusCode().value(),
                "Error",
                responseHeaders,
                e.getResponseBodyAsString(),
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
            }

            Map<String, Object> errorData = new HashMap<>();
            errorData.put("error", "API Wrapper request failed");
            errorData.put("message", errorMessage);
            errorData.put("status", statusCode);
            errorData.put("timestamp", Instant.now().toString());
            errorData.put("targetUrl", request.getUrl());

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