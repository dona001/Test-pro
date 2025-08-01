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

# Expose ports
EXPOSE 3000 3001


# Start both services
CMD ["/app/start.sh"] 