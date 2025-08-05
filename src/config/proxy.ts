// Environment-aware proxy configuration for frontend

// Extend Window interface for custom properties
declare global {
  interface Window {
    PROXY_PORT?: string;
  }
}

// Get the current hostname and port from the browser
const getCurrentHost = () => {
  const hostname = window.location.hostname;
  const port = window.location.port;
  return { hostname, port };
};

// Determine if we're in development or production
const isDevelopment = () => {
  const { hostname } = getCurrentHost();
  return hostname === 'localhost' || hostname === '127.0.0.1';
};

// Get the proxy server hostname (same as current hostname for production)
const getProxyHostname = () => {
  const { hostname } = getCurrentHost();
  
  if (isDevelopment()) {
    return 'localhost';
  } else {
    // In production, use the same hostname as the frontend
    return hostname;
  }
};

// Get the proxy server port (configurable via environment variable)
const getProxyPort = () => {
  // Check for environment variable first
  if (typeof window !== 'undefined' && window.PROXY_PORT) {
    return window.PROXY_PORT;
  }
  
  // Default to 3001
  return '3001';
};

export const getProxyBase = () => {
  const hostname = getProxyHostname();
  const port = getProxyPort();
  return `http://${hostname}:${port}/api/wrapper`;
};

export const getProxyHealthUrl = () => {
  const hostname = getProxyHostname();
  const port = getProxyPort();
  return `http://${hostname}:${port}/health`;
};

export const getProxyServerUrl = () => {
  const hostname = getProxyHostname();
  const port = getProxyPort();
  return `http://${hostname}:${port}`;
};

export const getProxySolutions = () => {
  const serverUrl = getProxyServerUrl();
  return [
    `Ensure the proxy server is running: cd backend && node server.js`,
    `Check if the proxy server is accessible at ${serverUrl}/health`,
    `Verify the proxy server is running on port ${getProxyPort()}`,
    `Check network connectivity to ${serverUrl}`,
    `Restart the backend proxy server if needed`
  ];
};

// Export environment info for debugging
export const getEnvironmentInfo = () => {
  const { hostname, port } = getCurrentHost();
  return {
    isDevelopment: isDevelopment(),
    currentHostname: hostname,
    currentPort: port,
    proxyHostname: getProxyHostname(),
    proxyPort: getProxyPort(),
    proxyUrl: getProxyServerUrl()
  };
}; 