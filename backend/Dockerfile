# Build stage
FROM node:24.4.1-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --force

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:24.4.1-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --production --force

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 4000

# Start application
CMD ["node", "dist/index.js"]

