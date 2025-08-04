const express = require('express');
const cors = require('cors');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const https = require('https');
const config = require('./config');

const app = express();
const PORT = config.port;

// Security middleware
app.use(helmet());
app.use(compression());

// Dynamic CORS configuration
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Enhanced body parsing middleware with support for different content types
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for debugging
    req.rawBody = buf;
  }
}));

// Add support for URL-encoded form data
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for debugging
    req.rawBody = buf;
  }
}));

// Add support for raw body (for non-JSON content types)
app.use(express.raw({ 
  type: ['text/*', 'application/xml', 'application/x-www-form-urlencoded'],
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for debugging
    req.rawBody = buf;
  }
}));

// Handle JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Body parsing error:', err.message);
    console.error('Raw body:', req.rawBody ? req.rawBody.toString() : 'No raw body');
    console.error('Content-Type:', req.headers['content-type']);
    
    // Try to provide more helpful error messages
    let errorMessage = 'The request body could not be parsed';
    let suggestions = [];
    
    if (err.message.includes('Unexpected token')) {
      errorMessage = 'Invalid JSON format in request body';
      suggestions = [
        'Check for missing quotes around property names',
        'Ensure all strings are properly quoted',
        'Remove trailing commas',
        'Check for extra characters after JSON'
      ];
    } else if (err.message.includes('Unexpected end')) {
      errorMessage = 'Incomplete JSON in request body';
      suggestions = [
        'Check for missing closing braces or brackets',
        'Ensure the JSON is complete'
      ];
    } else if (err.message.includes('null')) {
      errorMessage = 'Invalid JSON: null value not properly formatted';
      suggestions = [
        'Use null instead of "null" for null values',
        'Check for extra quotes around null'
      ];
    }
    
    return res.status(400).json({
      success: false,
      error: 'Invalid request body',
      message: errorMessage,
      details: err.message,
      suggestions,
      receivedBody: req.rawBody ? req.rawBody.toString() : null,
      contentType: req.headers['content-type']
    });
  }
  next(err);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'CORS Proxy Server',
    version: '1.0.0',
    environment: config.environment,
    serverIP: typeof config.current.serverIP === 'function' ? config.current.serverIP() : config.current.serverIP
  });
});

// Main proxy endpoint
app.all('/proxy', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      error: 'Missing URL parameter',
      message: 'Please provide a URL parameter: /proxy?url=<target_url>',
    });
  }

  let targetUrl;
  try {
    targetUrl = new URL(url);
  } catch (error) {
    return res.status(408).json({
      error: 'Invalid URL',
      message: 'Please provide a valid URL',
    });
  }

  // Block localhost and company IP based on environment
  const blockedHosts = ['127.0.0.1'];
  if (config.environment === 'development') {
    blockedHosts.push('localhost');
  } else {
    blockedHosts.push('10.106.246.81');
  }

  if (blockedHosts.includes(targetUrl.hostname)) {
    return res.status(400).json({
      error: 'Blocked hostname',
      message: `Cannot proxy requests to ${targetUrl.hostname} for security reasons`,
    });
  }

  console.log(`Proxying ${req.method} request to: ${targetUrl.href}`);
  console.log(`Request headers:`, req.headers);
  console.log(`Request body:`, req.body);
  console.log(`Content-Type:`, req.headers['content-type']);

  const httpsAgent = new https.Agent({ rejectUnauthorized: false });

  const axiosConfig = {
    method: req.method,
    url: targetUrl.href,
    httpsAgent,
    headers: {
      'User-Agent': 'API-Tester-Pro-CORS-Proxy/1.0.0',
      'Accept': req.headers.accept || '*/*',
      'Accept-Encoding': req.headers['accept-encoding'] || 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Cache-Control': req.headers['cache-control'] || 'no-cache',
    },
    timeout: 60000,
    maxRedirects: 5,
    validateStatus: () => true,
  };

  // Attach request body if needed
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    // Handle different content types
    const contentType = req.headers['content-type'] || '';
    
    if (req.body && req.body !== null && req.body !== 'null') {
      if (contentType.includes('application/json')) {
        axiosConfig.data = req.body;
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        // Convert form data to URLSearchParams
        if (typeof req.body === 'object') {
          const formData = new URLSearchParams();
          Object.keys(req.body).forEach(key => {
            formData.append(key, req.body[key]);
          });
          axiosConfig.data = formData;
        } else {
          axiosConfig.data = req.body;
        }
      } else if (contentType.includes('text/') || contentType.includes('application/xml')) {
        // Handle text content
        axiosConfig.data = req.body;
      } else {
        // Default to JSON if no content type specified
        axiosConfig.data = req.body;
        if (!contentType) {
          axiosConfig.headers['Content-Type'] = 'application/json';
        }
      }
      
      // Set Content-Type header if not already present
      if (!req.headers['content-type']) {
        axiosConfig.headers['Content-Type'] = 'application/json';
      }
    } else {
      console.log('No request body to send or body is null/undefined');
    }
  }

  // Copy non-sensitive headers
  const sensitiveHeaders = ['host', 'origin', 'referer', 'user-agent'];
  Object.keys(req.headers).forEach((header) => {
    if (!sensitiveHeaders.includes(header.toLowerCase())) {
      axiosConfig.headers[header] = req.headers[header];
    }
  });

  try {
    const startTime = Date.now();
    const response = await axios(axiosConfig);
    const endTime = Date.now();

    console.log(
      `Proxy successful: ${response.status} ${response.statusText} (${endTime - startTime}ms)`
    );

    const responseHeaders = {};
    Object.keys(response.headers).forEach((header) => {
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(header.toLowerCase())) {
        responseHeaders[header] = response.headers[header];
      }
    });

    res.status(response.status);
    Object.keys(responseHeaders).forEach((header) => {
      res.set(header, responseHeaders[header]);
    });

    res.json({
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data: response.data,
      proxyInfo: {
        timestamp: new Date().toISOString(),
        responseTime: endTime - startTime,
        targetUrl: targetUrl.href,
      },
    });
  } catch (error) {
    console.error(`Proxy error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Proxy request failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: 'The requested endpoint does not exist',
    availableEndpoints: ['/health', '/proxy'],
  });
});

// Start server
const messages = config.getConsoleMessages();
app.listen(PORT, '0.0.0.0', () => {
  const serverIP = typeof config.current.serverIP === 'function' ? config.current.serverIP() : config.current.serverIP;
  
  console.log(`${messages.serverRunning} ${PORT}`);
  console.log(`${messages.healthCheck}`);
  console.log(`${messages.proxyEndpoint}`);
  console.log(`${messages.corsEnabled}`);
  console.log(`${messages.startedAt} ${new Date().toISOString()}`);
  console.log(`🌍 Environment: ${config.environment}`);
  console.log(`🏠 Server IP: ${serverIP}`);
});

module.exports = app; 