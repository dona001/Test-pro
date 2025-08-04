# Development
NODE_ENV=development node server.js  # Uses localhost

# Production  
NODE_ENV=production node server.js   # Uses 192.168.120.4

# Build and run
docker build -t api-tester-pro .
docker-compose up -d

# Switch environments
node switch-env.js development
node switch-env.js production

# Test proxy functionality
node test-proxy.js

# Test Swagger import
node test-swagger-import.js

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