package com.apitester.wrapper.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.Map;

public class WrapperResponse {

    private boolean success;
    private int status;
    private String statusText;
    private Map<String, String> headers;
    private Object data;
    private WrapperInfo wrapperInfo;

    public WrapperResponse() {}

    public WrapperResponse(boolean success, int status, String statusText, 
                         Map<String, String> headers, Object data, WrapperInfo wrapperInfo) {
        this.success = success;
        this.status = status;
        this.statusText = statusText;
        this.headers = headers;
        this.data = data;
        this.wrapperInfo = wrapperInfo;
    }

    public static class WrapperInfo {
        private String timestamp;
        private long responseTime;
        private String targetUrl;
        private String method;

        public WrapperInfo() {}

        public WrapperInfo(String timestamp, long responseTime, String targetUrl, String method) {
            this.timestamp = timestamp;
            this.responseTime = responseTime;
            this.targetUrl = targetUrl;
            this.method = method;
        }

        public String getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(String timestamp) {
            this.timestamp = timestamp;
        }

        public long getResponseTime() {
            return responseTime;
        }

        public void setResponseTime(long responseTime) {
            this.responseTime = responseTime;
        }

        public String getTargetUrl() {
            return targetUrl;
        }

        public void setTargetUrl(String targetUrl) {
            this.targetUrl = targetUrl;
        }

        public String getMethod() {
            return method;
        }

        public void setMethod(String method) {
            this.method = method;
        }
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public String getStatusText() {
        return statusText;
    }

    public void setStatusText(String statusText) {
        this.statusText = statusText;
    }

    public Map<String, String> getHeaders() {
        return headers;
    }

    public void setHeaders(Map<String, String> headers) {
        this.headers = headers;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }

    public WrapperInfo getWrapperInfo() {
        return wrapperInfo;
    }

    public void setWrapperInfo(WrapperInfo wrapperInfo) {
        this.wrapperInfo = wrapperInfo;
    }
} 