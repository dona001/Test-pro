# Quick Commands Reference

## 🏠 **Local Development**

### **Backend:**
```bash
# Switch to development environment
cd backend
node switch-env.js development

# Start backend server
NODE_ENV=development node server.js
```

### **Frontend:**
```bash
# Start frontend development server
npm run dev
```

### **Access URLs:**
- **Frontend**: http://localhost:8080
- **Backend**: http://localhost:3001

---

## 🏢 **Production Deployment**

### **Backend:**
```bash
# Switch to production environment
cd backend
node switch-env.js production

# Start backend server
NODE_ENV=production node server.js
```

### **Frontend:**
```bash
# Build frontend for production
npm run build

# Serve production build
npm run preview
```

### **Access URLs:**
- **Frontend**: http://192.168.120.4:4173
- **Backend**: http://192.168.120.4:3001

---

## 🐳 **Docker Deployment**

### **Build Docker Image:**
```bash
# Build the Docker image
docker build -t api-tester-pro .
```

### **Run with Docker:**
```bash
# Run with default settings
docker run -p 3000:3000 -p 3001:3001 api-tester-pro

# Run with custom environment
docker run -p 8080:3000 -p 8081:3001 \
  -e NODE_ENV=production \
  -e SERVER_IP=your-ip \
  api-tester-pro
```

### **Docker Compose:**
```bash
# Start with docker-compose
docker-compose up -d

# Stop services
docker-compose down
```

### **Access URLs (Docker):**
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

---

## 🔧 **Environment Switching**

### **Development:**
```bash
node switch-env.js development
# Uses: localhost
```

### **Production:**
```bash
node switch-env.js production
# Uses: 192.168.120.4
```

---

## 📋 **Quick Reference**

| Environment | Backend Command | Frontend Command | Access |
|-------------|----------------|------------------|---------|
| **Local** | `NODE_ENV=development node server.js` | `npm run dev` | localhost:8080 |
| **Production** | `NODE_ENV=production node server.js` | `npm run build && npm run preview` | 192.168.120.4:4173 |
| **Docker** | `docker-compose up -d` | (included in container) | localhost:3000 |

---

## 🚀 **One-Line Commands**

### **Local Development:**
```bash
# Terminal 1: Backend
cd backend && node switch-env.js development && NODE_ENV=development node server.js

# Terminal 2: Frontend
npm run dev
```

### **Production:**
```bash
# Terminal 1: Backend
cd backend && node switch-env.js production && NODE_ENV=production node server.js

# Terminal 2: Frontend
npm run build && npm run preview
```

### **Docker:**
```bash
# Build and run
docker build -t api-tester-pro . && docker run -p 3000:3000 -p 3001:3001 api-tester-pro
``` 