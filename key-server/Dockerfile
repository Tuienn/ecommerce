# Production Dockerfile for Key Server
FROM node:24.4.1-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --production

# Copy application files
COPY . .

# Expose port
EXPOSE 8008

# Start application
CMD ["node", "app.js"]

