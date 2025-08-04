# CORS Proxy Server

A configurable CORS proxy server that can easily switch between development (localhost) and production (company IP) environments.

## 🚀 Quick Start

### 1. Switch Environment
```bash
# Switch to development (localhost)
node switch-env.js development

# Switch to production (company IP)
node switch-env.js production
```

### 2. Start Server
```bash
node server.js
```

### 3. Test Server
```bash
node test-proxy.js
```

## 🔧 Configuration

The server uses a configuration system to easily switch between environments:

### Development Environment
- **Server IP**: `localhost`
- **Test URL**: `http://localhost:3001`
- **CORS**: Allows specific localhost origins
- **Blocked Hosts**: `localhost`, `127.0.0.1`

### Production Environment
- **Server IP**: `10.106.246.81` (your company IP)
- **Test URL**: `http://10.106.246.81:3001`
- **CORS**: Allows all origins (dynamic)
- **Blocked Hosts**: `127.0.0.1`, `10.106.246.81`

## 📁 Files

- `server.js` - Main proxy server
- `config.js` - Configuration file
- `switch-env.js` - Environment switcher
- `test-proxy.js` - Test script for all HTTP methods

## 🧪 Testing

The test script will test:
- ✅ GET requests
- ✅ POST requests with JSON
- ✅ PUT requests with JSON
- ✅ DELETE requests
- ✅ Form data POST
- ✅ Plain text POST

## 🔍 API Endpoints

### Health Check
```
GET http://localhost:3001/health
```

### Proxy
```
ALL http://localhost:3001/proxy?url=<target_url>
```

## 📝 Example Usage

### GET Request
```bash
curl "http://localhost:3001/proxy?url=https://reqres.in/api/users/2"
```

### POST Request
```bash
curl -X POST "http://localhost:3001/proxy?url=https://reqres.in/api/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","job":"Developer"}'
```

### PUT Request
```bash
curl -X PUT "http://localhost:3001/proxy?url=https://reqres.in/api/users/2" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Smith","job":"Senior Developer"}'
```

### DELETE Request
```bash
curl -X DELETE "http://localhost:3001/proxy?url=https://reqres.in/api/users/2"
```

## 🛠️ Troubleshooting

### POST Requests Not Working
1. Make sure you're sending the correct `Content-Type` header
2. Check that the request body is valid JSON
3. Verify the target URL accepts POST requests

### CORS Issues
1. The server uses dynamic CORS - it should work with any origin
2. Check that the target server allows your request method

### Environment Issues
1. Use `node switch-env.js` to see current environment
2. Switch to the appropriate environment for your use case

## 🔒 Security Features

- Rate limiting (100 requests per 15 minutes)
- HTTPS agent with self-signed certificate support
- Blocked localhost/company IP for security
- Helmet security headers
- Request body size limits (10MB)

## 📊 Supported Content Types

- `application/json`
- `application/x-www-form-urlencoded`
- `text/*`
- `application/xml`

## 🎯 Environment Variables

- `NODE_ENV`: Set to `development` or `production`
- `PORT`: Server port (default: 3001) 

# Build image
docker build -t api-tester-pro .

# Run with default settings
docker run -p 3000:3000 -p 3001:3001 api-tester-pro

# Run with custom environment
docker run -p 8080:3000 -p 8081:3001 \
  -e NODE_ENV=production \
  -e SERVER_IP=your-ip \
  -e FRONTEND_PORT=8080 \
  -e BACKEND_PORT=8081 \
  api-tester-pro

# Docker Compose
docker-compose up -d


cd backend && NODE_ENV=production SERVER_IP=192.168.120.4 node server.js

# Terminal 2: Frontend
npm run build
npm run preview -- --host 0.0.0.0 --port 3000