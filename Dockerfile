# Dockerfile for API Tester Pro (Frontend + Backend)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/

# Install backend dependencies
RUN cd backend && npm ci --only=production && cd ..

# Copy backend source
COPY backend ./backend

# Copy pre-built frontend
COPY dist ./dist

# Install serve for frontend
RUN npm install -g serve

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start backend proxy server' >> /app/start.sh && \
    echo 'echo "🚀 Starting backend proxy server..."' >> /app/start.sh && \
    echo 'cd /app/backend' >> /app/start.sh && \
    echo 'NODE_ENV=${NODE_ENV:-production}' >> /app/start.sh && \
    echo 'SERVER_IP=${SERVER_IP:-0.0.0.0}' >> /app/start.sh && \
    echo 'PORT=${PORT:-3001}' >> /app/start.sh && \
    echo 'node server.js &' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Wait for backend to start' >> /app/start.sh && \
    echo 'echo "⏳ Waiting for backend to start..."' >> /app/start.sh && \
    echo 'sleep 3' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start frontend server' >> /app/start.sh && \
    echo 'echo "🌐 Starting frontend server..."' >> /app/start.sh && \
    echo 'cd /app' >> /app/start.sh && \
    echo 'serve -s dist -l tcp://0.0.0.0:${FRONTEND_PORT:-3000}' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expose ports
EXPOSE 3000 3001

# Set default environment variables
ENV NODE_ENV=production
ENV SERVER_IP=192.168.120.4
ENV PORT=3001
ENV FRONTEND_PORT=3000

# Start both services
CMD ["/app/start.sh"] 