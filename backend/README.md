# CORS Proxy Server

A lightweight Node.js + Express CORS proxy server for API Tester Pro.

## 🚀 Features

- ✅ **All HTTP Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- ✅ **CORS Enabled**: Configured for frontend origins
- ✅ **Security**: Rate limiting, helmet, input validation
- ✅ **Performance**: Compression, timeout handling
- ✅ **Logging**: Detailed request/response logging
- ✅ **Health Check**: `/health` endpoint for monitoring
- ✅ **Error Handling**: Comprehensive error responses

## 📦 Installation

```bash
cd backend
npm install
```

## 🏃‍♂️ Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Custom Port
```bash
PORT=3002 npm start
```

## 🔗 API Endpoints

### Health Check
```bash
GET http://localhost:3001/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "CORS Proxy Server",
  "version": "1.0.0"
}
```

### Proxy Endpoint
```bash
GET http://localhost:3001/proxy?url=<target_url>
POST http://localhost:3001/proxy?url=<target_url>
PUT http://localhost:3001/proxy?url=<target_url>
DELETE http://localhost:3001/proxy?url=<target_url>
PATCH http://localhost:3001/proxy?url=<target_url>
```

## 📝 Usage Examples

### GET Request
```bash
curl "http://localhost:3001/proxy?url=https://jsonplaceholder.typicode.com/posts/1"
```

### POST Request
```bash
curl -X POST "http://localhost:3001/proxy?url=https://jsonplaceholder.typicode.com/posts" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Post", "body": "Test content", "userId": 1}'
```

### PUT Request
```bash
curl -X PUT "http://localhost:3001/proxy?url=https://jsonplaceholder.typicode.com/posts/1" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Post", "body": "Updated content", "userId": 1}'
```

### DELETE Request
```bash
curl -X DELETE "http://localhost:3001/proxy?url=https://jsonplaceholder.typicode.com/posts/1"
```

## 🔧 Configuration

### Environment Variables
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode (development/production)

### CORS Origins
The server is configured to accept requests from:
- `http://localhost:8080`
- `http://localhost:8081`
- `http://localhost:8082`
- `http://localhost:3000`

### Rate Limiting
- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Headers**: Standard rate limit headers

## 🛡️ Security Features

### Input Validation
- ✅ URL validation
- ✅ Protocol restrictions (HTTP/HTTPS only)
- ✅ Localhost blocking
- ✅ Request size limits (10MB)

### Security Headers
- ✅ Helmet.js for security headers
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Request sanitization

### Error Handling
- ✅ Comprehensive error responses
- ✅ Request timeout (30 seconds)
- ✅ Redirect limits (5 max)
- ✅ Status code validation

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "status": 200,
  "statusText": "OK",
  "headers": {
    "content-type": "application/json",
    "cache-control": "no-cache"
  },
  "data": {
    "id": 1,
    "title": "Test Post"
  },
  "proxyInfo": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "responseTime": 245,
    "targetUrl": "https://jsonplaceholder.typicode.com/posts/1"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Proxy request failed",
  "message": "Request timeout",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🔍 Logging

The server provides detailed console logging:

```
🔄 Proxying GET request to: https://jsonplaceholder.typicode.com/posts/1
✅ Proxy successful: 200 OK (245ms)
❌ Proxy error: Request timeout
```

## 🚫 Limitations

### Blocked Features
- ❌ Localhost requests (security)
- ❌ Non-HTTP/HTTPS protocols
- ❌ Invalid URLs
- ❌ Missing URL parameter

### Rate Limits
- ⚠️ 100 requests per 15 minutes per IP
- ⚠️ 30-second request timeout
- ⚠️ 5 redirect maximum

## 🔧 Integration with Frontend

### Update Frontend CORS Proxy
Replace the old proxy services with the local proxy:

```typescript
// In src/api/corsProxy.ts
const LOCAL_PROXY = 'http://localhost:3001/proxy?url=';

// Update fetchWithCORS function to use local proxy
export async function fetchWithCORS(url: string, options: RequestInit = {}): Promise<Response> {
  try {
    // Try direct request first
    return await fetch(url, options);
  } catch (error) {
    // Use local proxy as fallback
    const proxyUrl = LOCAL_PROXY + encodeURIComponent(url);
    return await fetch(proxyUrl, {
      method: options.method || 'GET',
      headers: options.headers,
      body: options.body
    });
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using port 3001
   lsof -i :3001
   # Kill the process or use different port
   PORT=3002 npm start
   ```

2. **CORS Errors**
   - Ensure frontend origin is in CORS configuration
   - Check if proxy server is running
   - Verify request headers

3. **Timeout Errors**
   - Increase timeout in server.js (default: 30s)
   - Check target API availability
   - Verify network connectivity

4. **Rate Limit Exceeded**
   - Wait 15 minutes or restart server
   - Check request frequency
   - Consider increasing limits

## 📈 Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

### Logs
Monitor console output for:
- Request/response times
- Error messages
- Rate limit warnings
- Security alerts

## 🔄 Development

### Adding New Features
1. Update `server.js` with new endpoints
2. Add tests if needed
3. Update documentation
4. Test with frontend integration

### Debugging
```bash
# Enable debug logging
DEBUG=* npm run dev

# Check server logs
tail -f logs/server.log
```

## 📄 License

MIT License - see LICENSE file for details. 