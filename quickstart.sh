#!/bin/bash

# SQLite MCP Server Quickstart Script
# This script sets up a sample database and starts both MCP and HTTP servers

set -e  # Exit on any error

echo "🚀 SQLite MCP Server Quickstart"
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Setup sample database
echo "🗄️  Setting up sample database..."
node examples/setup-database.js
echo "✅ Sample database created at test.db"

# Set environment variables
export SQLITE_DB_PATH=test.db
export HTTP_PORT=${HTTP_PORT:-4000}

echo ""
echo "🎯 Starting MCP and HTTP Servers..."
echo "================================"
echo "📊 Database: test.db"
echo "🌐 HTTP Port: $HTTP_PORT (set HTTP_PORT env var to change)"
echo "🔧 MCP Tools available:"
echo "   - list_tables"
echo "   - describe_table"
echo "   - run_query"
echo "   - insert_row"
echo "   - update_row"
echo "   - delete_row"
echo ""
echo "🌐 HTTP Server: http://localhost:$HTTP_PORT"
echo "📋 HTTP Endpoints:"
echo "   - GET  /health                    - Health check"
echo "   - GET  /tables                    - List all tables"
echo "   - POST /query                     - Run SQL query"
echo "   - POST /tables/:tableName/insert  - Insert row"
echo "   - PUT  /tables/:tableName/update  - Update rows"
echo "   - DELETE /tables/:tableName/delete - Delete rows"
echo ""
echo "💡 Test with Postman:"
echo "   Import examples/postman-collection.json"
echo ""
echo "💡 Test with curl:"
echo "   curl http://localhost:$HTTP_PORT/health"
echo "   curl http://localhost:$HTTP_PORT/tables"
echo ""
echo "🛑 Press Ctrl+C to stop all servers"
echo "================================"

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $MCP_PID $HTTP_PID 2>/dev/null || true
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM

# Start HTTP wrapper server in background
echo "🌐 Starting HTTP wrapper server..."
node src/http-wrapper.js &
HTTP_PID=$!

# Wait a moment for HTTP server to start
sleep 2

# Start MCP server in background (for stdio communication)
echo "🔧 Starting MCP server..."
node src/server.js &
MCP_PID=$!

# Wait for both processes
wait $HTTP_PID $MCP_PID
