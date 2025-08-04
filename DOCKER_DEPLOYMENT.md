# Docker Deployment Guide

## 🐳 Environment-Based Docker Deployment

The Docker setup now supports **dynamic configuration** through environment variables. **No code changes needed** for different deployment environments!

## 📋 Quick Start

### 1. Build and Run (Default)
```bash
# Build the image
docker build -t api-tester-pro .

# Run with default settings
docker run -p 3000:3000 -p 3001:3001 api-tester-pro
```

### 2. Run with Custom Configuration
```bash
# Custom IP and ports
docker run \
  -p 8080:3000 \
  -p 8081:3001 \
  -e NODE_ENV=production \
  -e SERVER_IP=192.168.1.100 \
  -e FRONTEND_PORT=8080 \
  -e BACKEND_PORT=8081 \
  api-tester-pro
```

## 🚀 Docker Compose Examples

### Example 1: Local Development
```bash
# docker-compose.yml (default)
docker-compose up -d

# Access at:
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

### Example 2: Company Server (IP: 10.106.246.81)
```bash
# Set environment variables
export NODE_ENV=production
export SERVER_IP=10.106.246.81
export FRONTEND_PORT=8080
export BACKEND_PORT=8081

# Run with docker-compose
docker-compose up -d

# Access at:
# Frontend: http://10.106.246.81:8080
# Backend: http://10.106.246.81:8081
```

### Example 3: Cloud Server (IP: 203.0.113.1)
```bash
# Set environment variables
export NODE_ENV=production
export SERVER_IP=203.0.113.1
export FRONTEND_PORT=80
export BACKEND_PORT=3001

# Run with docker-compose
docker-compose up -d

# Access at:
# Frontend: http://203.0.113.1:80
# Backend: http://203.0.113.1:3001
```

### Example 4: Custom Environment File
```bash
# Create .env file
cat > .env << EOF
NODE_ENV=production
SERVER_IP=192.168.1.100
FRONTEND_PORT=8080
BACKEND_PORT=8081
EOF

# Run with environment file
docker-compose --env-file .env up -d
```

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `SERVER_IP` | `0.0.0.0` | Server IP address |
| `FRONTEND_PORT` | `3000` | Frontend port |
| `BACKEND_PORT` | `3001` | Backend port |

## 📊 Deployment Scenarios

### Scenario 1: Local Development
```bash
# .env file
NODE_ENV=development
SERVER_IP=localhost
FRONTEND_PORT=3000
BACKEND_PORT=3001

# Run
docker-compose --env-file .env up -d
```

### Scenario 2: Company Network
```bash
# .env file
NODE_ENV=production
SERVER_IP=10.106.246.81
FRONTEND_PORT=8080
BACKEND_PORT=8081

# Run
docker-compose --env-file .env up -d
```

### Scenario 3: Cloud Deployment
```bash
# .env file
NODE_ENV=production
SERVER_IP=203.0.113.1
FRONTEND_PORT=80
BACKEND_PORT=3001

# Run
docker-compose --env-file .env up -d
```

### Scenario 4: Load Balancer Setup
```bash
# .env file
NODE_ENV=production
SERVER_IP=load-balancer.example.com
FRONTEND_PORT=443
BACKEND_PORT=3001

# Run
docker-compose --env-file .env up -d
```

## 🐳 Docker Commands

### Build Image
```bash
# Build with default settings
docker build -t api-tester-pro .

# Build with custom tag
docker build -t api-tester-pro:v1.0.0 .
```

### Run Container
```bash
# Run with default settings
docker run -d -p 3000:3000 -p 3001:3001 api-tester-pro

# Run with custom environment
docker run -d \
  -p 8080:3000 \
  -p 8081:3001 \
  -e NODE_ENV=production \
  -e SERVER_IP=192.168.1.100 \
  -e FRONTEND_PORT=8080 \
  -e BACKEND_PORT=8081 \
  api-tester-pro
```

### Docker Compose
```bash
# Start services
docker-compose up -d

# Start with custom environment file
docker-compose --env-file .env up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and start
docker-compose up -d --build
```

## 🔍 Health Checks

### Check Backend Health
```bash
# Direct curl
curl http://localhost:3001/health

# From container
docker exec <container_id> curl http://localhost:3001/health

# Docker Compose
docker-compose exec api-tester-pro curl http://localhost:3001/health
```

### Check Frontend
```bash
# Direct curl
curl http://localhost:3000

# From container
docker exec <container_id> curl http://localhost:3000
```

## 🚨 Troubleshooting

### Issue: Container won't start
```bash
# Check logs
docker-compose logs api-tester-pro

# Check environment variables
docker-compose config

# Check container status
docker-compose ps
```

### Issue: Port conflicts
```bash
# Check if ports are in use
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001

# Use different ports
export FRONTEND_PORT=8080
export BACKEND_PORT=8081
docker-compose up -d
```

### Issue: CORS errors
```bash
# Ensure SERVER_IP matches your deployment
export SERVER_IP=your-actual-server-ip
docker-compose up -d
```

### Issue: Frontend can't connect to backend
```bash
# Check if both services are running
docker-compose ps

# Check backend health
curl http://localhost:3001/health

# Check frontend logs
docker-compose logs api-tester-pro
```

## 📝 Production Deployment

### 1. Create Production Environment File
```bash
# .env.production
NODE_ENV=production
SERVER_IP=your-production-ip
FRONTEND_PORT=80
BACKEND_PORT=3001
```

### 2. Deploy with Docker Compose
```bash
# Deploy to production
docker-compose --env-file .env.production up -d

# Check deployment
docker-compose --env-file .env.production ps
```

### 3. Set up Reverse Proxy (Optional)
```nginx
# nginx.conf
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔄 Migration from Hardcoded IPs

### Before (❌ Bad Practice)
```dockerfile
# Hardcoded IP in Dockerfile
ENV SERVER_IP=10.106.246.81
```

### After (✅ Good Practice)
```dockerfile
# Environment-based configuration
ENV SERVER_IP=${SERVER_IP:-0.0.0.0}
```

## 🎯 Benefits

1. **✅ No Code Changes**: Deploy to any server without modifying code
2. **✅ Environment Variables**: Configure via environment variables
3. **✅ Docker Ready**: Works seamlessly with Docker and Docker Compose
4. **✅ Flexible Ports**: Customize ports via environment variables
5. **✅ Production Ready**: Supports production deployments with load balancers
6. **✅ Health Checks**: Built-in health check monitoring

## 🎉 Ready for Any Deployment!

Now you can deploy to any server using Docker without changing a single line of code! Just set the environment variables and the system will automatically adapt.

### Quick Reference
```bash
# Development
docker-compose up -d

# Production with custom IP
SERVER_IP=your-ip docker-compose up -d

# Production with custom ports
FRONTEND_PORT=8080 BACKEND_PORT=8081 docker-compose up -d
``` 