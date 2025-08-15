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

# Test it
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_tables","arguments":{}}}' | docker exec -i sqlite-mcp node src/server.js
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

**Alternative: Use generic tool endpoint:**
```bash
curl -X POST http://localhost:4000/tools/list_tables \
  -H "Content-Type: application/json" \
  -d '{"arguments":{}}'
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

### Docker Deployment

#### Using Docker Scripts (Recommended)

We provide convenient scripts for Docker management:

```bash
# Build the image
./docker-run.sh build

# Run MCP server (stdio only)
./docker-run.sh run

# Run with HTTP wrapper on port 4000
./docker-run.sh run-http

# Run with HTTP wrapper on custom port
./docker-run.sh run-custom 8080

# Stop containers
./docker-run.sh stop

# View logs
./docker-run.sh logs

# Check status
./docker-run.sh status
```

#### Using npm Scripts

```bash
# Build the image
npm run docker:build

# Run MCP server
npm run docker:run

# Run with HTTP wrapper
npm run docker:run-http

# Stop containers
npm run docker:stop

# Clean containers
npm run docker:clean
```



## Docker Usage

The Docker image runs a **standard MCP server** that implements the Model Context Protocol for AI assistant integration and Docker MCP Catalog compatibility.

### Running the Container

**Important:** MCP servers are designed to run on-demand, not as persistent daemons. Each request starts a new container instance.

```bash
# Build the image (local development)
docker build -t sqlite-mcp-server .

# Test MCP server (supports multiple requests)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_tables","arguments":{}}}' | \
docker run --rm -i \
  -v $(pwd)/data:/data \
  -e SQLITE_DB_PATH=/data/database.db \
  sqlite-mcp-server

# Or use the pre-built image directly
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_tables","arguments":{}}}' | \
docker run --rm -i \
  -v $(pwd)/data:/data \
  -e SQLITE_DB_PATH=/data/database.db \
  arungupta/sqlite-mcp-server
```

**Note:** 
- MCP server supports multiple sequential requests in a single session
- Server runs on-demand and handles stdio communication
- For persistent HTTP access, use the HTTP wrapper: `./docker-run.sh run-http`
- For production use with AI assistants, the MCP client manages container lifecycle

## Testing

For testing and development, you have several options:

### 1. MCP Server Testing

#### Using Docker Scripts (Recommended)
```bash
# Test MCP server with Docker
./docker-run.sh run
```

### 2. HTTP Wrapper Testing

#### Using Docker Scripts (Recommended)
```bash
# Run with HTTP wrapper on port 4000
./docker-run.sh run-http

# Run with HTTP wrapper on custom port
./docker-run.sh run-custom 8080
```

#### Running Locally
```bash
# Start HTTP wrapper locally
npm run http
```

#### Example HTTP Requests (curl)
```bash
# Health check
curl http://localhost:4000/health

# List all tables
curl http://localhost:4000/tables

# Run a SQL query
curl -X POST http://localhost:4000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM users"}'
```

### Using MCP Protocol (For AI Assistants)

The Docker container implements the Model Context Protocol for integration with AI assistants and MCP clients:

```bash
# Test MCP protocol directly
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_tables","arguments":{}}}' | docker run --rm -i -v $(pwd)/data:/data -e SQLITE_DB_PATH=/data/database.db sqlite-mcp-server
```

### Configuration Options

**Environment Variables:**
- `SQLITE_DB_PATH` - Path to SQLite database file (default: `/data/database.db` for Docker, `:memory:` for local)

**Volume Mounts:**
- `/data` - Database storage directory
- Mount your database file: `-v /host/path/database.db:/data/database.db`

**Port Mapping:**
- No port mapping needed - MCP communication is via stdio

**Database Setup:**
The server automatically connects to the specified database. If the database doesn't exist, it will be created. For testing, you can use an in-memory database:

```bash
# Local testing with in-memory database
export SQLITE_DB_PATH=:memory:

# Docker with persistent database
docker run -v /path/to/database:/data -e SQLITE_DB_PATH=/data/database.db ...
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
