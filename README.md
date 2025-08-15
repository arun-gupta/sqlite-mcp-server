# SQLite MCP Server

A Model Context Protocol (MCP) server that provides SQLite database operations through a standardized interface. This server allows AI assistants and other MCP clients to interact with SQLite databases using a set of predefined tools.

## Features

- **List Tables**: Discover all tables in the database
- **Describe Schema**: Get detailed information about table structure
- **Run Queries**: Execute SELECT queries with security validation
- **Insert Data**: Add new rows to tables
- **Update Data**: Modify existing rows based on conditions
- **Delete Data**: Remove rows based on conditions
- **Comprehensive Logging**: Debug incoming requests and outgoing responses
- **Docker Ready**: Containerized for easy deployment

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
- ✅ Start the MCP server ready for use

The server will be running with a sample database containing:
- 3 users (John Doe, Jane Smith, Bob Johnson)
- 3 categories (Technology, Travel, Food)
- 4 sample posts with relationships

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

2. Run the container:
```bash
docker run -d \
  --name sqlite-mcp \
  -v /path/to/database:/data \
  -e SQLITE_DB_PATH=/data/database.db \
  sqlite-mcp-server
```

## Usage

### MCP Client Integration

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
# Start the HTTP wrapper
npm run http
```

This starts an HTTP server on `http://localhost:3000` that translates HTTP requests to MCP protocol messages.

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

#### Example HTTP Requests:

```bash
# List tables
curl http://localhost:3000/tables

# Run a query
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM users WHERE active = 1"}'

# Insert a user
curl -X POST http://localhost:3000/tables/users/insert \
  -H "Content-Type: application/json" \
  -d '{"data": {"name": "Alice Johnson", "email": "alice@example.com"}}'
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
- **License**: MIT

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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review the example messages in `examples/mcp-messages.md`
3. Open an issue on the repository

## Changelog

### Version 1.0.0
- Initial release
- Basic SQLite operations (CRUD)
- MCP protocol implementation
- Docker support
- Comprehensive logging
- Security features
