# Neural Trading System - Production Docker Image
# Multi-stage build for optimal image size

# Stage 1: Build and test
FROM node:18-alpine AS builder

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for testing)
RUN npm ci

# Copy source code
COPY . .

# Run tests to ensure code quality
RUN npm test

# Stage 2: Production image
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Install build dependencies for native modules and dumb-init
RUN apk add --no-cache python3 make g++ dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies, then remove build dependencies to reduce image size
RUN npm ci --only=production && \
    npm cache clean --force && \
    apk del python3 make g++

# Copy application code from builder
COPY --from=builder /app/src ./src
COPY --from=builder /app/examples ./examples
COPY --from=builder /app/docs ./docs

# Set ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "src/start-server.js"]
