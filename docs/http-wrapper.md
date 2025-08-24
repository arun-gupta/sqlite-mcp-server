# HTTP Wrapper Documentation

## Overview

The SQLite MCP Server includes an optional HTTP wrapper that provides REST-like access to MCP tools. This allows for easy testing and integration with standard HTTP clients while maintaining the underlying MCP protocol structure.

**Note:** This project has been fully converted to TypeScript for better type safety and developer experience. The HTTP wrapper internally spawns the MCP server as a child process, providing both HTTP API and MCP server functionality from a single container.

## Available HTTP Endpoints

### Basic Operations
- `GET /health` - Health check
- `GET /info` - Server information
- `GET /tools` - List available tools
- `POST /tools/:toolName` - Execute specific tool

### Convenience Endpoints
- `GET /tables` - List all tables
- `GET /tables/:tableName` - Describe table schema
- `POST /query` - Run SQL query
- `POST /tables/:tableName/insert` - Insert row
- `PUT /tables/:tableName/update` - Update rows
- `DELETE /tables/:tableName/delete` - Delete rows

## Example Workflows

### Development
```bash
# Start both MCP and HTTP locally
./quickstart.sh

# Use HTTP API for testing
curl http://localhost:3001/health
```

### Production
```bash
# Start container for AI assistant integration
docker run -d --name sqlite-prod -v /var/lib/sqlite:/data arungupta/sqlite-mcp-server
```

## Understanding the Dual-Layer Architecture

The HTTP wrapper demonstrates two ways to access the same functionality:

### 1. Convenience Endpoints (REST-like)
- `GET /tables` → Lists all tables
- `POST /query` → Runs SQL query
- `POST /tables/:tableName/insert` → Inserts row

### 2. Execute Tool Endpoints (MCP Protocol)
- `POST /tools/call` with `{"name": "list_tables", "arguments": {}}`
- `POST /tools/call` with `{"name": "run_query", "arguments": {"query": "SELECT * FROM users"}}`
- `POST /tools/call` with `{"name": "insert_row", "arguments": {...}}`

## Purpose of Execute Tool Queries

### Educational Value
- Shows how MCP tools are invoked under the hood
- Demonstrates the JSON-RPC format used by MCP
- Helps understand the protocol translation layer

### For AI Assistant Integration
- Shows the exact format AI assistants would use
- Demonstrates the generic tool calling mechanism
- Provides examples for MCP client development

### Flexibility
- **Convenience Endpoints:** Easy to use for common operations, REST-like, familiar to developers
- **Execute Tool Endpoints:** Generic - can call any MCP tool, future-proof, protocol-compliant, AI-ready

## Example Usage

### Convenience Endpoints (Easy)
```bash
# List all tables
curl http://localhost:3001/tables

# Run a query
curl -X POST http://localhost:3001/query \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM users WHERE active = 1"}'

# Insert a user
curl -X POST http://localhost:3001/tables/users/insert \
  -H "Content-Type: application/json" \
  -d '{"data": {"name": "Test User", "email": "test@example.com"}}'
```

### Execute Tool Endpoints (MCP Format)
```bash
# List all tables
curl -X POST http://localhost:3001/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name": "list_tables", "arguments": {}}'

# Run a query
curl -X POST http://localhost:3001/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name": "run_query", "arguments": {"query": "SELECT * FROM users WHERE active = 1"}}'

# Insert a user
curl -X POST http://localhost:3001/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name": "insert_row", "arguments": {"table_name": "users", "data": {"name": "Test User", "email": "test@example.com"}}}'
```

## Postman Collection

Import the provided Postman collection for easy testing:
1. Open Postman
2. Click "Import"
3. Select `examples/postman-collection.json`
4. The collection includes all endpoints with sample requests

### Postman Collection Workflow

The delete operations in the collection are designed to work with the insert operations. The workflow is:
1. Run "Insert Row" to add a test user with email "test-delete@example.com"
2. Run "Delete Row" to delete that same user using the email as the condition

This ensures the delete operation will always work with fresh data.

## TypeScript Build Process

The project uses TypeScript for type safety. The build process compiles TypeScript to JavaScript:

```bash
# Build TypeScript to JavaScript
npm run build

# Type checking without compilation
npm run type-check

# Development with auto-reload
npm run dev:http
```

## Running the HTTP Wrapper

### Local Development
```bash
# Start HTTP wrapper locally
npm run http

# Start with custom port
HTTP_PORT=8080 npm run http

# Development mode with auto-reload
npm run dev:http
```

### Docker
```bash
# Run with HTTP wrapper (includes both HTTP API and MCP server)
docker run -d \
  --name sqlite-mcp-http \
  -p 3001:3001 \
  -v $(pwd)/data:/data \
  -e SQLITE_DB_PATH=/data/database.db \
  -e SERVER_MODE=http \
  -e HTTP_PORT=3001 \
  arungupta/sqlite-mcp-server

# Test HTTP endpoints
curl http://localhost:3001/health
curl http://localhost:3001/tables
```

### Quickstart (Both MCP and HTTP)
```bash
# Start both MCP and HTTP servers with sample database
./quickstart.sh
```

## Response Format

All HTTP endpoints return JSON responses in the MCP format:

```json
{
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Found 4 tables:\n- categories\n- post_categories\n- posts\n- users"
      }
    ]
  },
  "jsonrpc": "2.0",
  "id": 1755298894980
}
```

## Error Handling

Errors are returned in the standard MCP error format:

```json
{
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Error executing run_query: SQLITE_ERROR: no such table: nonexistent"
      }
    ],
    "isError": true
  },
  "jsonrpc": "2.0",
  "id": 1755298894981
}
```

## Security Considerations

- All database operations use prepared statements to prevent SQL injection
- Only SELECT queries are allowed in the `run_query` tool
- Input validation is performed on all tool parameters
- CORS headers are included for cross-origin requests
