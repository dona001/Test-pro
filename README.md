# API Tester Pro

A powerful API testing tool with built-in CORS proxy, collection management, and comprehensive testing features.

## 🚀 Quick Start

### Using Docker (Recommended)
```bash
# Build and run with Docker Compose
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend Proxy: http://localhost:3001
```

### Manual Setup
```bash
# Install dependencies
npm install
cd backend && npm install && cd ..

# Start backend proxy
cd backend && npm start

# Start frontend (in new terminal)
npm run dev
```

## 🛠️ Features

- **API Testing**: Test any REST API endpoint
- **CORS Proxy**: Built-in backend proxy for CORS-free testing
- **Collection Management**: Import and test Postman collections
- **Swagger Support**: Import OpenAPI/Swagger specifications
- **Response Validation**: Custom validation rules
- **Test Code Generation**: Generate test code for your APIs
- **Multi-endpoint Testing**: Batch test multiple endpoints
- **Dual Reporting System**: Extent Reports (immediate) and Allure Reports (advanced)
- **Error Handling**: Comprehensive error handling and logging

## 📁 Project Structure

```
├── src/                    # Frontend source code
├── backend/               # CORS proxy server
├── sample-files/          # Sample API collections
├── Dockerfile            # Docker configuration
└── docker-compose.yml    # Docker Compose setup
```

## 🔧 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start backend proxy
cd backend && npm start
```

## 🐳 Docker Commands

```bash
# Build and run
docker-compose up --build

# Run in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

## 📊 Health Checks

- **Frontend**: http://localhost:3000
- **Backend Proxy**: http://localhost:3001/health

## 🎯 Usage

1. **Import Collections**: Use the Collection Testing section to import Postman collections or Swagger files
2. **Test APIs**: Use the main interface to test individual endpoints
3. **CORS Testing**: The built-in proxy handles CORS restrictions automatically
4. **Validation**: Add custom validation rules for response testing
5. **Generate Reports**: Choose between Extent Reports (immediate) or Allure Reports (advanced)
6. **Code Generation**: Generate test code for your APIs

## 🔒 Security

- Built-in CORS proxy for secure API testing
- Rate limiting on proxy server
- Input validation and sanitization
- No external proxy dependencies

## 📝 License

MIT License 