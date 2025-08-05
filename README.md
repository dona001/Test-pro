# API Tester Pro

A comprehensive API testing tool with validation, reporting, and integration capabilities.

## 📁 Project Structure

```
├── backend/           # Express-based CORS wrapper server
│   ├── server.js     # Main server file
│   ├── config/       # Configuration files
│   ├── routes/       # API routes
│   ├── middleware/   # Express middleware
│   ├── utils/        # Utility functions
│   └── README.md     # Backend documentation
│
├── src/              # React + Vite application
│   ├── components/   # React components
│   ├── pages/        # Page components
│   ├── api/          # API utilities
│   └── utils/        # Utility functions
│
├── public/           # Static assets
└── README.md         # This file
```

## 🚀 Quick Start

### Backend

```bash
cd backend
npm install
npm run dev
```

The backend server will start on `http://localhost:3001`

### Frontend

```bash
npm install
npm run dev
```

The frontend application will start on `http://localhost:8080`

## 🎯 Features

### Backend Features
- **CORS Wrapper Endpoint**: `POST /api/wrapper` - Handles all API requests
- **Health Check**: `GET /health` - Server health monitoring
- **Security**: URL validation, blocked hosts protection
- **Error Handling**: Comprehensive error handling and logging
- **Performance**: Optimized response times

### Frontend Features
- **API Testing Interface**: Test any HTTP method with custom headers and body
- **CORS-Free Testing**: Uses backend wrapper to avoid CORS issues
- **Response Validation**: Comprehensive response analysis and validation
- **Collection Testing**: Import and test API collections
- **Smart Import**: Import from Postman collections, Swagger/OpenAPI specs
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS

## 🔧 Development

### Running Both Applications

1. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend** (in new terminal):
   ```bash
   npm run dev
   ```

3. **Access Application**:
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3001

### Testing

**Backend Tests**:
```bash
cd backend
node test-wrapper-endpoint.js
node test-proxy.js
node test-swagger-import.js
node test-frontend-integration.js
```

**Frontend Development**:
```bash
npm run dev
```

## 📦 Package Independence

Each part is self-contained and can run independently:

- **Backend**: Can run without frontend for API testing
- **Frontend**: Can connect to any backend with the same API interface
- **Dependencies**: Each manages its own dependencies
- **Configuration**: Separate configuration files

## 🔗 API Communication

The frontend communicates with the backend through the wrapper endpoint:

```typescript
// Frontend API call
const response = await fetch('http://localhost:3001/api/wrapper', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://api.example.com/data',
    method: 'GET',
    headers: { 'Authorization': 'Bearer token' }
  })
});
```

## 🛠️ Build and Deploy

### Backend Deployment
```bash
cd backend
npm install
npm start
```

### Frontend Build
```bash
npm install
npm run build
```

## 📚 Documentation

- [Backend Documentation](backend/README.md)
- [Architecture Diagrams](ARCHITECTURE_DIAGRAMS.md)
- [Features Documentation](FEATURES_DOCUMENTATION.md)
- [Quick Commands](QUICK_COMMANDS.md)

## 🤝 Contributing

1. Make changes in the appropriate directory (backend/ or src/)
2. Test changes in both applications
3. Update documentation as needed
4. Ensure both applications work together

## 📄 License

MIT License 