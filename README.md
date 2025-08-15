# SQLite MCP Server

A Model Context Protocol (MCP) server that provides SQLite database operations through a standardized interface. This server allows AI assistants and other MCP clients to interact with SQLite databases using a set of predefined tools.

## Features

- **True Dual Interface**: Single server exposing both HTTP API and MCP protocol simultaneously
- **List Tables**: Discover all tables in the database
- **Describe Schema**: Get detailed information about table structure
- **Run Queries**: Execute SELECT queries with security validation
- **Insert Data**: Add new rows to tables
- **Update Data**: Modify existing rows based on conditions
- **Delete Data**: Remove rows based on conditions
- **Comprehensive Logging**: Debug incoming requests and outgoing responses
- **Docker Ready**: Containerized for easy deployment
- **Postman Collection**: Ready-to-use API testing collection

## Prerequisites

- Node.js 18 or higher
- SQLite 3 (included in Docker image)

## Quick Start

Get up and running in seconds with our quickstart script:

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
- **HTTP Server**: Available at http://localhost:3000 for Postman/curl testing

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

3. Set the database path environment variable:
```bash
export SQLITE_DB_PATH=/path/to/your/database.db
```

4. Start the server:
```bash
npm start
```

### Docker Deployment

1. Build the Docker image:
```bash
docker build -t sqlite-mcp-server .
```

2. Run the container with HTTP access:
```bash
docker run -d \
  --name sqlite-mcp \
  -p 4000:4000 \
  -v /path/to/database:/data \
  -e SQLITE_DB_PATH=/data/database.db \
  -e HTTP_PORT=4000 \
  sqlite-mcp-server
```

3. Access the HTTP API:
```bash
# Health check
curl http://localhost:4000/health

# List tables
curl http://localhost:4000/tables

# Run a query
curl -X POST http://localhost:4000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM users"}'
```

**Note:** The Docker container runs the HTTP wrapper by default, which provides both HTTP API access and MCP protocol support.

## Docker Usage

The Docker image runs a **dual MCP/HTTP server** that exposes both MCP protocol and HTTP API simultaneously in a single container, giving you maximum flexibility in how you interact with the SQLite database.

### Running the Container

```bash
# Build the image
docker build -t sqlite-mcp-server .

# Run with both HTTP API and MCP protocol access
docker run -d \
  --name sqlite-mcp \
  -p 4000:4000 \
  -v /path/to/database:/data \
  -e SQLITE_DB_PATH=/data/database.db \
  -e HTTP_PORT=4000 \
  sqlite-mcp-server
```

### Using HTTP API (Recommended for Testing)

The container exposes an HTTP API on port 4000 that you can use with standard HTTP clients:

```bash
# Health check
curl http://localhost:4000/health

# List all tables
curl http://localhost:4000/tables

# Run a SQL query
curl -X POST http://localhost:4000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM users"}'

# Insert a new user
curl -X POST http://localhost:4000/tables/users/insert \
  -H "Content-Type: application/json" \
  -d '{"data": {"name": "John Doe", "email": "john@example.com"}}'

# Update a user
curl -X PUT http://localhost:4000/tables/users/update \
  -H "Content-Type: application/json" \
  -d '{"data": {"email": "john.updated@example.com"}, "where": {"id": 1}}'

# Delete a user
curl -X DELETE http://localhost:4000/tables/users/delete \
  -H "Content-Type: application/json" \
  -d '{"where": {"email": "john@example.com"}}'
```

### Using MCP Protocol (For AI Assistants)

The same container also supports the Model Context Protocol for integration with AI assistants and MCP clients:

```bash
# The container supports both HTTP and MCP simultaneously
# For MCP-only usage, you can omit port mapping:
docker run -d \
  --name sqlite-mcp-mcp \
  -v /path/to/database:/data \
  -e SQLITE_DB_PATH=/data/database.db \
  sqlite-mcp-server

# The container communicates via stdio for MCP protocol
# Use with MCP clients that support stdio transport
```

### Configuration Options

**Environment Variables:**
- `SQLITE_DB_PATH` - Path to SQLite database file (default: `/data/database.db`)
- `HTTP_PORT` - HTTP server port (default: `4000`)

**Volume Mounts:**
- `/data` - Database storage directory
- Mount your database file: `-v /host/path/database.db:/data/database.db`

**Port Mapping:**
- `4000:4000` - HTTP API access
- Omit port mapping for MCP-only usage

### Example Workflows

**Development with HTTP API:**
```bash
# Start container
docker run -d --name sqlite-dev -p 4000:4000 -v $(pwd)/data:/data sqlite-mcp-server

# Use Postman collection
# Import examples/postman-collection.json and test all endpoints

# Use curl for quick tests
curl http://localhost:4000/health
curl http://localhost:4000/tables
```

**Production with MCP Protocol:**
```bash
# Start container for AI assistant integration
docker run -d --name sqlite-prod -v /var/lib/sqlite:/data sqlite-mcp-server

# Configure MCP client to use this container
# The container communicates via stdio for MCP protocol
```

**Hybrid Usage (Default):**
```bash
# Start container with both HTTP and MCP support (this is the default)
docker run -d --name sqlite-hybrid -p 4000:4000 -v /data:/data sqlite-mcp-server

# Use HTTP API for monitoring and testing
curl http://localhost:4000/health

# Use MCP protocol for AI assistant integration
# Container supports both simultaneously in a single process
```

## Usage

The SQLite MCP Server provides a **true dual interface** - a single server that exposes both HTTP API and MCP protocol simultaneously.

### Dual Server (Recommended)

The dual server runs both interfaces in a single process:

```bash
# Start the dual server
npm run dual

# Or use the quickstart script
./quickstart.sh
```

**Benefits of the dual server:**
- ✅ **Single process** - No need to manage multiple servers
- ✅ **Shared database connection** - Better performance and consistency
- ✅ **True simultaneous access** - Both HTTP and MCP work at the same time
- ✅ **Simplified deployment** - One container, both interfaces

### Individual Servers (Legacy)

You can still run individual servers if needed:

```bash
# HTTP API only
npm run http

# MCP Protocol only
npm start
```

**Available HTTP endpoints:**
- `GET /health` - Health check
- `GET /tables` - List all tables
- `POST /query` - Run SQL query
- `POST /tables/:tableName/insert` - Insert row
- `PUT /tables/:tableName/update` - Update rows
- `DELETE /tables/:tableName/delete` - Delete rows

### MCP Protocol (For AI Assistants)

The server implements the Model Context Protocol and can be integrated with any MCP-compatible client. The server communicates via stdio and supports the following tools:

#### Available Tools

1. **list_tables**
   - Lists all tables in the database
   - No parameters required

2. **describe_table**
   - Describes the schema of a specific table
   - Parameters: `table_name` (string)

3. **run_query**
   - Executes SELECT queries and returns results as JSON
   - Parameters: `query` (string) - SQL SELECT statement
   - Security: Only SELECT queries are allowed

4. **insert_row**
   - Inserts a new row into a table
   - Parameters: `table_name` (string), `data` (object)

5. **update_row**
   - Updates rows based on conditions
   - Parameters: `table_name` (string), `data` (object), `where` (object)

6. **delete_row**
   - Deletes rows based on conditions
   - Parameters: `table_name` (string), `where` (object)

### Example Usage

#### List Tables
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "list_tables",
    "arguments": {}
  }
}
```

#### Run a Query
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "run_query",
    "arguments": {
      "query": "SELECT * FROM users WHERE active = 1"
    }
  }
}
```

#### Insert Data
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "insert_row",
    "arguments": {
      "table_name": "users",
      "data": {
        "name": "John Doe",
        "email": "john@example.com",
        "active": 1
      }
    }
  }
}
```

## Testing

### Quick Test

After running the quickstart script, you can test the server with a simple command:

```bash
# Test listing tables
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_tables","arguments":{}}}' | node src/server.js

# Test querying users
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"run_query","arguments":{"query":"SELECT * FROM users WHERE active = 1"}}}' | node src/server.js
```

### HTTP Wrapper for Postman

For easier testing with Postman or other HTTP clients, use the HTTP wrapper:

```bash
# Start the HTTP wrapper (default port 4000)
npm run http

# Start with custom port
HTTP_PORT=8080 npm run http
```

**Or use the quickstart script to start both servers:**
```bash
# Start with default port 4000
./quickstart.sh

# Start with custom port
HTTP_PORT=8080 ./quickstart.sh
```

This starts an HTTP server that translates HTTP requests to MCP protocol messages.

#### Available HTTP Endpoints:

**Basic Operations:**
- `GET /health` - Health check
- `GET /info` - Server information
- `GET /tools` - List available tools
- `POST /tools/:toolName` - Execute specific tool

**Convenience Endpoints:**
- `GET /tables` - List all tables
- `GET /tables/:tableName` - Describe table schema
- `POST /query` - Run SQL query
- `POST /tables/:tableName/insert` - Insert row
- `PUT /tables/:tableName/update` - Update rows
- `DELETE /tables/:tableName/delete` - Delete rows

#### Postman Collection

Import the provided Postman collection for easy testing:
1. Open Postman
2. Click "Import"
3. Select `examples/postman-collection.json`
4. The collection includes all endpoints with sample requests

**Note:** The delete operations in the collection are designed to work with the insert operations. The workflow is:
1. Run "Insert Row" to add a test user with email "test-delete@example.com"
2. Run "Delete Row" to delete that same user using the email as the condition
This ensures the delete operation will always work with fresh data.

#### Example HTTP Requests:

```bash
# List tables
curl http://localhost:4000/tables

# Run a query
curl -X POST http://localhost:4000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM users WHERE active = 1"}'

# Insert a user
curl -X POST http://localhost:4000/tables/users/insert \
  -H "Content-Type: application/json" \
  -d '{"data": {"name": "Test User", "email": "test@example.com"}}'

# Delete the user we just created
curl -X DELETE http://localhost:4000/tables/users/delete \
  -H "Content-Type: application/json" \
  -d '{"where": {"email": "test@example.com"}}'

# With custom port (e.g., 8080)
curl http://localhost:8080/tables
```

### Full Test Suite

Run the complete test suite to verify all functionality:

```bash
npm test
```

This will start the server and send a series of test messages to verify all tools are working correctly.

## Configuration

### Environment Variables

- `SQLITE_DB_PATH`: Path to the SQLite database file (default: `:memory:` for in-memory database)

### Database Setup

The server will automatically connect to the specified database. If the database doesn't exist, it will be created. For testing, you can use an in-memory database by setting:

```bash
export SQLITE_DB_PATH=:memory:
```

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

- **Name**: sqlite-mcp-server
- **Version**: 1.0.0
- **Description**: SQLite database operations via MCP
- **Author**: Your Name
- **License**: Apache 2.0

## Development

### Project Structure

```
sqlite-mcp-server/
├── src/
│   └── server.js          # Main MCP server implementation
├── test/
│   └── test.js           # Test suite
├── examples/
│   └── mcp-messages.md   # Example MCP messages
├── package.json          # Node.js dependencies
├── mcp.json             # MCP manifest
├── Dockerfile           # Docker configuration
├── .dockerignore        # Docker ignore file
└── README.md           # This file
```

### Adding New Tools

To add a new tool:

1. Add the tool definition to the `ListToolsRequestSchema` handler
2. Add a case in the `CallToolRequestSchema` handler
3. Implement the tool method in the `SQLiteMCPServer` class
4. Update the documentation and examples

### Building for Production

```bash
# Build Docker image
docker build -t sqlite-mcp-server .

# Run with persistent storage
docker run -d \
  --name sqlite-mcp \
  -v /data/sqlite:/data \
  -e SQLITE_DB_PATH=/data/production.db \
  sqlite-mcp-server
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
