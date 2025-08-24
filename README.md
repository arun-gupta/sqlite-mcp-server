# SQLite MCP Server

[![Docker Image CI](https://github.com/arun-gupta/sqlite-mcp-server/workflows/Docker%20Image%20CI/badge.svg)](https://github.com/arun-gupta/sqlite-mcp-server/actions)
[![npm package](https://img.shields.io/badge/npm-%40arun--gupta%2Fsqlite--mcp--server-blue.svg)](https://github.com/arun-gupta/sqlite-mcp-server/packages)
[![Docker Pulls](https://img.shields.io/docker/pulls/arungupta/sqlite-mcp-server)](https://hub.docker.com/r/arungupta/sqlite-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)](https://www.typescriptlang.org/)

A Model Context Protocol (MCP) server that provides SQLite database operations through a standardized interface. This server allows AI assistants and other MCP clients to interact with SQLite databases using a set of predefined tools. Includes an optional HTTP wrapper for easy testing and development.

## Features

### Core MCP Server
- **Standard MCP Protocol**: Clean implementation for AI assistants and MCP clients
- **Database Operations**: List tables, describe schema, run queries, insert/update/delete data
- **Security**: SELECT-only queries with parameterized statements to prevent SQL injection
- **Comprehensive Logging**: Debug incoming requests and outgoing responses

### Development & Testing
- **HTTP Wrapper**: Optional HTTP API for easy testing with Postman/curl
- **Postman Collection**: Ready-to-use API testing collection with examples
- **Quickstart Script**: Automated setup with database creation and server startup
- **Port Conflict Resolution**: Automatic detection and resolution of port conflicts

### Deployment & Integration
- **Docker Ready**: Containerized for easy deployment and MCP Catalog compatibility
- **Docker Scripts**: Comprehensive Docker management with build, run, stop, and monitoring
- **Environment Configuration**: Flexible database path and port configuration
- **Production Ready**: Non-root user, health checks, and proper error handling

## Prerequisites

- Node.js 18 or higher
- SQLite 3 (included in Docker image)

## Quick Start

Get up and running in seconds with our quickstart script:

### Option 1: Local Development

```bash
# Clone the repository
git clone <repository-url>
cd sqlite-mcp-server

# Run the quickstart script
./quickstart.sh
```

This script will:
- ✅ Check Node.js version (requires 18+)
- ✅ Install dependencies automatically
- ✅ Create a sample database with test data
- ✅ Start both MCP server and HTTP wrapper server

The servers will be running with a sample database containing:
- 3 users (John Doe, Jane Smith, Bob Johnson)
- 3 categories (Technology, Travel, Food)
- 4 sample posts with relationships

**Available servers:**
- **MCP Server**: Ready for stdio communication
- **HTTP Server**: Available at http://localhost:3001 for Postman/curl testing

### Option 2: Use Pre-built Docker Image

If you want to try it immediately without building:

```bash
# Create data directory
mkdir -p data
```

**Available Docker Images:**
- **Docker Hub** (recommended): `arungupta/sqlite-mcp-server:latest`
- **GitHub Container Registry**: `ghcr.io/arun-gupta/sqlite-mcp-server:latest`

#### HTTP Mode (Recommended) - Both HTTP API and MCP Server

```bash
# Run in HTTP mode (includes both HTTP API and MCP server)
# Option 1: Docker Hub (recommended)
docker run -d \
  --name sqlite-mcp-http \
  -p 3001:3001 \
  -v $(pwd)/data:/data \
  -e SQLITE_DB_PATH=/data/database.db \
  -e SERVER_MODE=http \
  -e HTTP_PORT=3001 \
  arungupta/sqlite-mcp-server:latest

# Option 2: GitHub Container Registry
docker run -d \
  --name sqlite-mcp-http \
  -p 3001:3001 \
  -v $(pwd)/data:/data \
  -e SQLITE_DB_PATH=/data/database.db \
  -e SERVER_MODE=http \
  -e HTTP_PORT=3001 \
  ghcr.io/arun-gupta/sqlite-mcp-server:latest

# Test HTTP endpoints (curl)
curl http://localhost:3001/health
curl http://localhost:3001/tables
curl http://localhost:3001/tables/users
curl -X POST http://localhost:3001/query \
  -H "Content-Type: application/json" \
  -d '{"query":"SELECT * FROM users"}'

# Test MCP server directly (stdio) - same container!
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_tables","arguments":{}}}' | docker exec -i sqlite-mcp-http node dist/server.js
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"describe_table","arguments":{"table_name":"users"}}}' | docker exec -i sqlite-mcp-http node dist/server.js
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"run_query","arguments":{"query":"SELECT * FROM users"}}}' | docker exec -i sqlite-mcp-http node dist/server.js
```

#### MCP Mode Only - For Direct MCP Client Integration

```bash
# Run in MCP mode only (for AI assistants and MCP clients)
# Option 1: Docker Hub (recommended)
docker run -d \
  --name sqlite-mcp \
  -v $(pwd)/data:/data \
  -e SQLITE_DB_PATH=/data/database.db \
  arungupta/sqlite-mcp-server:latest

# Option 2: GitHub Container Registry
docker run -d \
  --name sqlite-mcp \
  -v $(pwd)/data:/data \
  -e SQLITE_DB_PATH=/data/database.db \
  ghcr.io/arun-gupta/sqlite-mcp-server:latest

# Test MCP server (stdio)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_tables","arguments":{}}}' | docker exec -i sqlite-mcp node dist/server.js
```



#### Test HTTP Wrapper (Postman)
Import the provided Postman collection from `examples/postman-collection.json` for a complete set of pre-configured requests.

## Installation

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd sqlite-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
# MCP server only
npm start

# HTTP wrapper for testing
npm run http

# Both servers (recommended)
./quickstart.sh
```

## CI/CD Pipeline

This project uses GitHub Actions for automated building, testing, and publishing:

### 🚀 **Automated Workflow**

Every push to the `main` branch triggers:

1. **✅ Build & Test**:
   - TypeScript compilation and type checking
   - Docker image building
   - HTTP mode testing (health endpoints)
   - MCP mode testing (stdio communication)

2. **✅ Publish Docker Images**:
   - **Docker Hub**: `arungupta/sqlite-mcp-server:latest`
   - **GitHub Container Registry**: `ghcr.io/arun-gupta/sqlite-mcp-server:latest`

3. **✅ Publish npm Package**:
   - **GitHub npm registry**: `@arun-gupta/sqlite-mcp-server@{timestamp}.0.0`

### 📋 **Workflow Status**

The workflow status is shown in the badge at the top of this README.

### 🔧 **Manual Trigger**

You can manually trigger the workflow:
1. Go to [Actions](https://github.com/arun-gupta/sqlite-mcp-server/actions)
2. Select "Docker Image CI"
3. Click "Run workflow"

## Docker

The Docker image supports two modes:

- **MCP Mode** (default): Persistent MCP server for client integration
- **HTTP Mode**: HTTP API server for testing and development

Use the `SERVER_MODE` environment variable to switch between modes.

### Quick Start

**Using Docker Scripts (Recommended):**
```bash
# Build and test MCP server
./docker-run.sh build
./docker-run.sh run

# Or run with HTTP wrapper for testing
./docker-run.sh run-http
```

**Using npm Scripts:**
```bash
# Build and test MCP server
npm run docker:build
npm run docker:run

# Or run with HTTP wrapper for testing
npm run docker:run-http
```

### Docker Modes

The Docker image supports two modes:

- **HTTP Mode** (recommended): Includes both HTTP API and MCP server
- **MCP Mode**: Direct MCP server only (no HTTP overhead)

**Quick Mode Switching:**
```bash
# Check which mode is running
docker ps

# Stop current container
docker stop sqlite-mcp sqlite-mcp-http 2>/dev/null || true

# Switch to HTTP mode
docker run -d --name sqlite-mcp-http -p 3001:3001 -v $(pwd)/data:/data -e SERVER_MODE=http -e HTTP_PORT=3001 sqlite-mcp-server

# Switch to MCP mode
docker run -d --name sqlite-mcp -v $(pwd)/data:/data -e SERVER_MODE=mcp sqlite-mcp-server
```

### Publishing to Docker Hub

To create and publish the `arungupta/sqlite-mcp-server` image:

**Note:** Replace `arungupta` with your Docker Hub username if you want to publish to your own repository.

```bash
# Build with the correct tag
docker build -t arungupta/sqlite-mcp-server:latest .

# Test the image locally (persistent mode)
docker run -d \
  --name sqlite-mcp-server \
  -v $(pwd)/data:/data \
  -e SQLITE_DB_PATH=/data/database.db \
  arungupta/sqlite-mcp-server:latest

# Check logs to verify it's running
docker logs sqlite-mcp-server

# Clean up container
docker stop sqlite-mcp-server && docker rm sqlite-mcp-server

# Login to Docker Hub (if not already logged in)
docker login

# Push to Docker Hub
docker push arungupta/sqlite-mcp-server:latest

# Tag with version (optional)
docker tag arungupta/sqlite-mcp-server:latest arungupta/sqlite-mcp-server:1.0.0
docker push arungupta/sqlite-mcp-server:1.0.0
```





### Full Test Suite

Run the complete test suite to verify all functionality:

```bash
npm test
```

This will start the server and send a series of test messages to verify all tools are working correctly.



## Security Considerations

- **Query Validation**: Only SELECT queries are allowed in the `run_query` tool to prevent destructive operations
- **Parameterized Queries**: All database operations use prepared statements to prevent SQL injection
- **Non-root User**: Docker container runs as a non-root user for security
- **Input Validation**: All tool parameters are validated against their schemas

## Logging

The server provides comprehensive logging for debugging:

- All incoming MCP requests are logged to stderr
- All outgoing responses are logged to stderr
- Database connection status is logged
- Tool execution errors are logged with details

## Docker MCP Catalog

This server is designed to be compatible with the Docker MCP Catalog. The `mcp.json` manifest file defines the server configuration for MCP clients.

### Docker Catalog Metadata

- **Name**: arungupta/sqlite-mcp-server
- **Version**: 1.0.0
- **Description**: SQLite database operations via MCP
- **Author**: Arun Gupta
- **License**: Apache 2.0
- **Docker Hub**: `arungupta/sqlite-mcp-server`

## Development

### Project Structure

```
sqlite-mcp-server/
├── src/
│   ├── server.js          # Main MCP server implementation
│   └── http-wrapper.js    # HTTP wrapper for testing
├── test/
│   └── test.js           # Test suite
├── examples/
│   ├── setup-database.ts  # Database setup script
│   └── postman-collection.json # Postman collection
├── package.json          # Node.js dependencies
├── mcp.json             # MCP manifest
├── Dockerfile           # Docker configuration
├── docker-run.sh        # Docker management script
├── quickstart.sh        # Quick setup script
└── README.md           # This file
```



## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check that `SQLITE_DB_PATH` is set correctly
   - Ensure the database file is accessible
   - Verify SQLite is installed (in Docker image)

2. **Permission Denied**
   - Ensure the database file has proper read/write permissions
   - In Docker, check volume mount permissions

3. **Tool Not Found**
   - Verify the tool name is correct
   - Check that the tool is properly registered in the server

### Debug Mode

Enable verbose logging by setting the environment variable:

```bash
export DEBUG=1
```



## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
# Test commit to trigger workflow
