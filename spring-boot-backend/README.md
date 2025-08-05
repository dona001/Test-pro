# API Tester Wrapper - Spring Boot Backend

This is the Spring Boot equivalent of the Node.js CORS Wrapper Server for API testing.

## 🚀 Features

- **CORS Wrapper Server** - Proxy API requests to avoid CORS issues
- **Universal HTTP Support** - GET, POST, PUT, DELETE, PATCH methods
- **Security Features** - Rate limiting, blocked hosts, input validation
- **Health Monitoring** - Built-in health checks and metrics
- **Environment Configuration** - Development and production profiles
- **Comprehensive Logging** - Detailed request/response logging

## 📋 Prerequisites

- Java 17 or higher
- Maven 3.6 or higher

## 🛠️ Installation & Setup

### 1. Build the Application

```bash
cd spring-boot-backend
mvn clean install
```

### 2. Run the Application

#### Development Mode
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

#### Production Mode
```bash
mvn spring-boot:run
```

#### Using JAR
```bash
java -jar target/api-wrapper-1.0.0.jar
```

### 3. Verify Installation

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-08-05T14:30:00.000Z",
  "service": "CORS Wrapper Server",
  "version": "1.0.0",
  "environment": "production",
  "serverIP": "192.168.120.4"
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SPRING_PROFILES_ACTIVE` | `production` | Active profile |
| `SERVER_PORT` | `3001` | Server port |
| `APP_ENVIRONMENT` | `production` | Environment mode |

### Application Properties

```yaml
app:
  environment: production  # development or production
  server:
    port: 3001
    ip:
      development: localhost
      production: 192.168.120.4
```

## 📡 API Endpoints

### 1. Health Check
```
GET /health
```

### 2. API Wrapper
```
POST /api/wrapper
```

**Request Body:**
```json
{
  "url": "https://jsonplaceholder.typicode.com/posts/1",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer token",
    "Content-Type": "application/json"
  },
  "body": {
    "title": "Test Post",
    "body": "Test content"
  }
}
```

**Response:**
```json
{
  "success": true,
  "status": 200,
  "statusText": "OK",
  "headers": {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-cache"
  },
  "data": {
    "id": 1,
    "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
    "body": "quia et suscipit suscipit recusandae consequuntur expedita et cum reprehenderit molestiae ut ut quas totam nostrum rerum est autem sunt rem eveniet architecto",
    "userId": 1
  },
  "wrapperInfo": {
    "timestamp": "2025-08-05T14:30:00.000Z",
    "responseTime": 245,
    "targetUrl": "https://jsonplaceholder.typicode.com/posts/1",
    "method": "GET"
  }
}
```

## 🔒 Security Features

### Blocked Hosts
- **Development:** `localhost`, `127.0.0.1`
- **Production:** `127.0.0.1`, `10.106.246.81`

### CORS Configuration
- **Development:** Specific localhost origins
- **Production:** All origins allowed

### Rate Limiting
- Built-in Spring Security rate limiting
- Configurable limits per endpoint

## 🧪 Testing

### Test the Wrapper Endpoint

```bash
# GET request
curl -X POST http://localhost:3001/api/wrapper \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://jsonplaceholder.typicode.com/posts/1",
    "method": "GET"
  }'

# POST request
curl -X POST http://localhost:3001/api/wrapper \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://jsonplaceholder.typicode.com/posts",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "title": "Test Post",
      "body": "Test content",
      "userId": 1
    }
  }'
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3001/actuator/health
```

### Application Info
```bash
curl http://localhost:3001/actuator/info
```

## 🔄 Migration from Node.js

### Key Differences

| Feature | Node.js | Spring Boot |
|---------|---------|-------------|
| **Language** | JavaScript | Java 17 |
| **Framework** | Express.js | Spring Boot 3.2 |
| **HTTP Client** | Axios | WebClient |
| **Validation** | Manual | Bean Validation |
| **Security** | Helmet | Spring Security |
| **Monitoring** | Manual | Spring Actuator |

### Equivalent Endpoints

| Node.js | Spring Boot |
|---------|-------------|
| `GET /health` | `GET /health` |
| `POST /api/wrapper` | `POST /api/wrapper` |

### Configuration Mapping

| Node.js Config | Spring Boot Config |
|----------------|-------------------|
| `config.port` | `server.port` |
| `config.environment` | `app.environment` |
| `config.current.serverIP` | `app.server.ip.*` |

## 🚀 Deployment

### Docker Deployment

```dockerfile
FROM openjdk:17-jre-slim
COPY target/api-wrapper-1.0.0.jar app.jar
EXPOSE 3001
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

### Build and Run with Docker

```bash
# Build
mvn clean package

# Build Docker image
docker build -t api-wrapper .

# Run container
docker run -p 3001:3001 api-wrapper
```

## 📝 Logs

### Development Logs
```
2025-08-05 14:30:00 - 🌐 API Wrapper: GET request to: https://jsonplaceholder.typicode.com/posts/1
2025-08-05 14:30:00 - 📋 Request headers: {Content-Type=application/json}
2025-08-05 14:30:00 - ✅ API Wrapper successful: 200 (245ms) - Target URL: https://jsonplaceholder.typicode.com/posts/1
```

### Production Logs
```
2025-08-05 14:30:00 - INFO  - API Wrapper: GET request to: https://jsonplaceholder.typicode.com/posts/1
2025-08-05 14:30:00 - INFO  - API Wrapper successful: 200 (245ms) - Target URL: https://jsonplaceholder.typicode.com/posts/1
```

## 🔧 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using port 3001
   lsof -i :3001
   
   # Kill the process
   kill -9 <PID>
   ```

2. **Java Version Issues**
   ```bash
   # Check Java version
   java -version
   
   # Should be Java 17 or higher
   ```

3. **Memory Issues**
   ```bash
   # Increase heap size
   java -Xmx2g -jar target/api-wrapper-1.0.0.jar
   ```

## 📚 Additional Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Spring WebFlux Documentation](https://docs.spring.io/spring-framework/reference/web/webflux.html)
- [Spring Security Documentation](https://docs.spring.io/spring-security/reference/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. 