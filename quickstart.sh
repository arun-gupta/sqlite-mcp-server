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

# Function to check and kill processes on a port
check_and_kill_port() {
    local port=$1
    local pid=""
    
    # Try different methods to find processes on the port
    if command -v lsof &> /dev/null; then
        pid=$(lsof -ti:$port 2>/dev/null || echo "")
    elif command -v netstat &> /dev/null; then
        pid=$(netstat -tulpn 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1 | head -1 || echo "")
    elif command -v ss &> /dev/null; then
        pid=$(ss -tulpn 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1 | head -1 || echo "")
    fi
    
    if [ -n "$pid" ] && [ "$pid" != "-" ]; then
        echo "⚠️  Port $port is already in use by PID $pid. Killing process..."
        kill -9 $pid 2>/dev/null || true
        sleep 2
        echo "✅ Port $port is now available"
    else
        echo "✅ Port $port is available"
    fi
}

# Check if port is already in use and kill existing processes
echo "🔍 Checking if port $HTTP_PORT is available..."
check_and_kill_port $HTTP_PORT

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
echo "💡 Test MCP protocol:"
echo "   echo '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"list_tables\",\"arguments\":{}}}' | node src/dual-server.js"
echo ""
echo "🛑 Press Ctrl+C to stop all servers"
echo "================================"

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Stopping server..."
    kill $DUAL_PID 2>/dev/null || true
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM

# Start dual MCP/HTTP server in background
echo "🚀 Starting dual MCP/HTTP server..."
node src/dual-server.js &
DUAL_PID=$!

# Wait for the dual server
wait $DUAL_PID
