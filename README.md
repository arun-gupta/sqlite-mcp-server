# SQLite MCP Server

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
- **HTTP Server**: Available at http://localhost:4000 for Postman/curl testing

### Option 2: Use Pre-built Docker Image

If you want to try it immediately without building:

```bash
# Create data directory
mkdir -p data

# Run with pre-built image
docker run -d \
  --name sqlite-mcp \
  -v $(pwd)/data:/data \
  -e SQLITE_DB_PATH=/data/database.db \
  arungupta/sqlite-mcp-server


```

### Quick Testing

Once the servers are running, you can quickly test both interfaces:

#### Test MCP Server (stdio)

**List all tables:**
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_tables","arguments":{}}}' | SQLITE_DB_PATH=test.db node src/server.js
```

**Get user table schema:**
```bash
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"describe_table","arguments":{"table_name":"users"}}}' | SQLITE_DB_PATH=test.db node src/server.js
```

**Query all users:**
```bash
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"run_query","arguments":{"query":"SELECT * FROM users"}}}' | SQLITE_DB_PATH=test.db node src/server.js
```

#### Test HTTP Wrapper (curl)

**List all tables:**
```bash
curl http://localhost:4000/tables
```

**Get user table schema:**
```bash
curl http://localhost:4000/tables/users
```

**Query all users:**
```bash
curl -X POST http://localhost:4000/query \
  -H "Content-Type: application/json" \
  -d '{"query":"SELECT * FROM users"}'
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

## Docker

The Docker image runs a **standard MCP server** that implements the Model Context Protocol for AI assistant integration and Docker MCP Catalog compatibility.

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

### Manual Docker Commands

**Important:** The MCP server supports both one-shot and persistent modes for different use cases.

```bash
# Build the image (local development)
docker build -t sqlite-mcp-server .

# Test MCP server (one-shot for single requests)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_tables","arguments":{}}}' | \
docker run --rm -i \
  -v $(pwd)/data:/data \
  -e SQLITE_DB_PATH=/data/database.db \
  sqlite-mcp-server

# Or use the pre-built image
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_tables","arguments":{}}}' | \
docker run --rm -i \
  -v $(pwd)/data:/data \
  -e SQLITE_DB_PATH=/data/database.db \
  arungupta/sqlite-mcp-server
```

**Note:** 
- One-shot mode: Each request starts a new container instance (good for testing)
- Persistent mode: Server stays running and handles multiple sequential requests
- For production use with AI assistants, the MCP client manages container lifecycle
- For persistent HTTP access, use the HTTP wrapper: `./docker-run.sh run-http`

### Publishing to Docker Hub

To create and publish the `arungupta/sqlite-mcp-server` image:

**Note:** Replace `arungupta` with your Docker Hub username if you want to publish to your own repository.

```bash
# Build with the correct tag
docker build -t arungupta/sqlite-mcp-server:latest .

# Test the image locally
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_tables","arguments":{}}}' | \
docker run --rm -i \
  -v $(pwd)/data:/data \
  -e SQLITE_DB_PATH=/data/database.db \
  arungupta/sqlite-mcp-server:latest

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
│   ├── setup-database.js  # Database setup script
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
