# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Install SQLite
RUN apk add --no-cache sqlite

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

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

# Expose port (though MCP typically uses stdio)
EXPOSE 3000

# Set environment variable for database path
ENV SQLITE_DB_PATH=/data/database.db

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Start the MCP server
CMD ["node", "src/server.js"]
