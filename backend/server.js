const express = require('express');
const cors = require('cors');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'api_key', 'x-api-key', 'x-auth-token', 'x-custom-header'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'CORS Proxy Server',
    version: '1.0.0'
  });
});

// Handle preflight OPTIONS requests
app.options('/proxy', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, api_key, x-api-key, x-auth-token, x-custom-header');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// Main proxy endpoint
app.all('/proxy', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        error: 'Missing URL parameter',
        message: 'Please provide a URL parameter: /proxy?url=<target_url>'
      });
    }

    // Validate URL
    let targetUrl;
    try {
      targetUrl = new URL(url);
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid URL',
        message: 'Please provide a valid URL'
      });
    }

    // Security: Block certain protocols and localhost
    if (targetUrl.protocol !== 'https:' && targetUrl.protocol !== 'http:') {
      return res.status(400).json({
        error: 'Unsupported protocol',
        message: 'Only HTTP and HTTPS protocols are supported'
      });
    }

    if (targetUrl.hostname === 'localhost' || targetUrl.hostname === '127.0.0.1') {
      return res.status(400).json({
        error: 'Localhost not allowed',
        message: 'Cannot proxy requests to localhost for security reasons'
      });
    }

    console.log(`🔄 Proxying ${req.method} request to: ${targetUrl.href}`);

    // Prepare request configuration
    const axiosConfig = {
      method: req.method,
      url: targetUrl.href,
      headers: {
        'User-Agent': 'API-Tester-Pro-CORS-Proxy/1.0.0',
        'Accept': req.headers.accept || '*/*',
        'Accept-Language': req.headers['accept-language'] || 'en-US,en;q=0.9',
        'Accept-Encoding': req.headers['accept-encoding'] || 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': req.headers['cache-control'] || 'no-cache',
      },
      timeout: 30000, // 30 seconds timeout
      maxRedirects: 5,
      validateStatus: () => true, // Accept all status codes
    };

    // Add request body for POST, PUT, PATCH, DELETE
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.body) {
      axiosConfig.data = req.body;
    }

    // Add custom headers (excluding sensitive ones)
    const sensitiveHeaders = ['host', 'origin', 'referer', 'user-agent'];
    Object.keys(req.headers).forEach(header => {
      if (!sensitiveHeaders.includes(header.toLowerCase())) {
        axiosConfig.headers[header] = req.headers[header];
      }
    });

    // Make the request
    const startTime = Date.now();
    const response = await axios(axiosConfig);
    const endTime = Date.now();

    console.log(`✅ Proxy successful: ${response.status} ${response.statusText} (${endTime - startTime}ms)`);

    // Prepare response headers
    const responseHeaders = {};
    Object.keys(response.headers).forEach(header => {
      // Filter out headers that might cause issues
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(header.toLowerCase())) {
        responseHeaders[header] = response.headers[header];
      }
    });

    // Send response
    res.status(response.status);
    
    // Set response headers
    Object.keys(responseHeaders).forEach(header => {
      res.set(header, responseHeaders[header]);
    });

    // Send response data
    if (response.data) {
      res.json({
        success: true,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data: response.data,
        proxyInfo: {
          timestamp: new Date().toISOString(),
          responseTime: endTime - startTime,
          targetUrl: targetUrl.href
        }
      });
    } else {
      res.json({
        success: true,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        proxyInfo: {
          timestamp: new Date().toISOString(),
          responseTime: endTime - startTime,
          targetUrl: targetUrl.href
        }
      });
    }

  } catch (error) {
    console.error(`❌ Proxy error: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: 'Proxy request failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: 'The requested endpoint does not exist',
    availableEndpoints: ['/health', '/proxy']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CORS Proxy Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Proxy endpoint: http://localhost:${PORT}/proxy?url=<target_url>`);
  console.log(`🌐 CORS enabled for: http://localhost:8080, http://localhost:8081, http://localhost:8082, http://localhost:3000`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});

module.exports = app; 