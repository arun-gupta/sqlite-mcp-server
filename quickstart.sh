#!/bin/bash

# SQLite MCP Server Quickstart Script
# This script sets up a sample database and starts the MCP server

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

# Set environment variable
export SQLITE_DB_PATH=test.db

echo ""
echo "🎯 Starting MCP Server..."
echo "================================"
echo "📊 Database: test.db"
echo "🔧 Tools available:"
echo "   - list_tables"
echo "   - describe_table"
echo "   - run_query"
echo "   - insert_row"
echo "   - update_row"
echo "   - delete_row"
echo ""
echo "💡 Test the server with:"
echo "   echo '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"list_tables\",\"arguments\":{}}}' | node src/server.js"
echo ""
echo "🛑 Press Ctrl+C to stop the server"
echo "================================"

# Start the MCP server
node src/server.js
