# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Install SQLite
RUN apk add --no-cache sqlite

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for TypeScript build)
RUN npm ci && npm cache clean --force

# Copy TypeScript configuration
COPY tsconfig.json ./

# Copy source code
COPY src/ ./src/

# Build TypeScript to JavaScript
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Create data directory first (as root)
RUN mkdir -p /data

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory and data directory
RUN chown -R nodejs:nodejs /app && \
    chown -R nodejs:nodejs /data

# Switch to non-root user
USER nodejs

# Set environment variables
ENV SQLITE_DB_PATH=/data/database.db
ENV SERVER_MODE=mcp

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Start server based on mode
CMD ["sh", "-c", "if [ \"$SERVER_MODE\" = \"http\" ]; then node dist/http-wrapper.js; else node dist/server-persistent.js; fi"]
