// Configuration for the CORS Proxy Server
const config = {
  // Environment: 'development' or 'production'
  environment: process.env.NODE_ENV || 'production',
  
  // Server configuration
  port: process.env.PORT || 3001,
  
  // IP addresses - hardcoded for simplicity
  development: {
    serverIP: 'localhost',
    allowedOrigins: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082', 'http://localhost:3000'],
    consoleMessages: {
      serverRunning: '🚀 CORS Wrapper Server running on port',
      healthCheck: '📡 Health check: http://localhost',
      wrapperEndpoint: '🔗 Wrapper endpoint: http://localhost',
      corsEnabled: '🌐 CORS enabled for: http://localhost:8080, http://localhost:8081, http://localhost:8082, http://localhost:3000',
      startedAt: '⏰ Started at:'
    }
  },
  
  production: {
    serverIP: '192.168.120.4', // Your production IP
    allowedOrigins: ['*'], // Allow all origins in production
    consoleMessages: {
      serverRunning: '🚀 CORS Wrapper Server running on port',
      healthCheck: '📡 Health check: http://192.168.120.4',
      wrapperEndpoint: '🔗 Wrapper endpoint: http://192.168.120.4',
      corsEnabled: '🌐 CORS enabled for dynamic origins',
      startedAt: '⏰ Started at:'
    }
  },
  
  // Get current configuration based on environment
  get current() {
    return this[this.environment] || this.development;
  },
  
  // Helper function to get server URL
  getServerURL(path = '') {
    const serverIP = this.current.serverIP;
    const base = `http://${serverIP}:${this.port}`;
    return path ? `${base}${path}` : base;
  },
  
  // Helper function to get console messages
  getConsoleMessages() {
    const messages = this.current.consoleMessages;
    const serverIP = this.current.serverIP;
    
    // Replace placeholders with actual values
    return {
      serverRunning: messages.serverRunning,
      healthCheck: `${messages.healthCheck}:${this.port}/health`,
      wrapperEndpoint: `${messages.wrapperEndpoint}:${this.port}/api/wrapper`,
      corsEnabled: messages.corsEnabled,
      startedAt: messages.startedAt
    };
  }
};

module.exports = config; 