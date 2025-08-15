#!/usr/bin/env node

import express from 'express';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MCPHTTPWrapper {
  constructor() {
    this.app = express();
    this.port = process.env.HTTP_PORT || 4000;
    this.mcpServer = null;
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS for Postman
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Logging middleware
    this.app.use((req, res, next) => {
      console.log(`[HTTP] ${req.method} ${req.path}`, req.body);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', service: 'sqlite-mcp-http-wrapper' });
    });

    // Get server info
    this.app.get('/info', async (req, res) => {
      try {
        const result = await this.sendMCPMessage({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            clientInfo: { name: 'http-wrapper', version: '1.0.0' }
          }
        });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // List available tools
    this.app.get('/tools', async (req, res) => {
      try {
        const result = await this.sendMCPMessage({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/list',
          params: {}
        });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Execute a tool
    this.app.post('/tools/:toolName', async (req, res) => {
      try {
        const { toolName } = req.params;
        const { arguments: args = {} } = req.body;

        const result = await this.sendMCPMessage({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: args
          }
        });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Convenience endpoints for common operations
    this.app.get('/tables', async (req, res) => {
      try {
        const result = await this.sendMCPMessage({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: 'list_tables',
            arguments: {}
          }
        });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/tables/:tableName', async (req, res) => {
      try {
        const { tableName } = req.params;
        const result = await this.sendMCPMessage({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: 'describe_table',
            arguments: { table_name: tableName }
          }
        });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/query', async (req, res) => {
      try {
        const { query } = req.body;
        if (!query) {
          return res.status(400).json({ error: 'Query is required' });
        }

        const result = await this.sendMCPMessage({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: 'run_query',
            arguments: { query }
          }
        });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/tables/:tableName/insert', async (req, res) => {
      try {
        const { tableName } = req.params;
        const { data } = req.body;
        
        if (!data) {
          return res.status(400).json({ error: 'Data is required' });
        }

        const result = await this.sendMCPMessage({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: 'insert_row',
            arguments: { table_name: tableName, data }
          }
        });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.put('/tables/:tableName/update', async (req, res) => {
      try {
        const { tableName } = req.params;
        const { data, where } = req.body;
        
        if (!data || !where) {
          return res.status(400).json({ error: 'Data and where conditions are required' });
        }

        const result = await this.sendMCPMessage({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: 'update_row',
            arguments: { table_name: tableName, data, where }
          }
        });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.delete('/tables/:tableName/delete', async (req, res) => {
      try {
        const { tableName } = req.params;
        const { where } = req.body;
        
        if (!where) {
          return res.status(400).json({ error: 'Where conditions are required' });
        }

        const result = await this.sendMCPMessage({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: 'delete_row',
            arguments: { table_name: tableName, where }
          }
        });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        availableEndpoints: [
          'GET /health',
          'GET /info',
          'GET /tools',
          'POST /tools/:toolName',
          'GET /tables',
          'GET /tables/:tableName',
          'POST /query',
          'POST /tables/:tableName/insert',
          'PUT /tables/:tableName/update',
          'DELETE /tables/:tableName/delete'
        ]
      });
    });
  }

  async sendMCPMessage(message) {
    return new Promise((resolve, reject) => {
      if (!this.mcpServer) {
        this.startMCPServer();
      }

      let responseData = '';
      let errorData = '';

      const mcpProcess = spawn('node', [join(__dirname, 'server.js')], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, SQLITE_DB_PATH: process.env.SQLITE_DB_PATH || 'test.db' }
      });

      mcpProcess.stdout.on('data', (data) => {
        responseData += data.toString();
      });

      mcpProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      mcpProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`MCP server exited with code ${code}: ${errorData}`));
          return;
        }

        try {
          const lines = responseData.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          const response = JSON.parse(lastLine);
          
          if (response.error) {
            reject(new Error(response.error.message || 'MCP server error'));
          } else {
            resolve(response);
          }
        } catch (error) {
          reject(new Error(`Failed to parse MCP response: ${error.message}`));
        }
      });

      mcpProcess.on('error', (error) => {
        reject(new Error(`Failed to start MCP server: ${error.message}`));
      });

      // Send the message to MCP server
      mcpProcess.stdin.write(JSON.stringify(message) + '\n');
      mcpProcess.stdin.end();
    });
  }

  startMCPServer() {
    // MCP server is started per-request for simplicity
    // In production, you might want to keep it running
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`🚀 HTTP Wrapper started on http://localhost:${this.port}`);
      console.log(`📊 Database: ${process.env.SQLITE_DB_PATH || 'test.db'}`);
      console.log('');
      console.log('📋 Available endpoints:');
      console.log('  GET  /health                    - Health check');
      console.log('  GET  /info                      - Server info');
      console.log('  GET  /tools                     - List available tools');
      console.log('  POST /tools/:toolName           - Execute specific tool');
      console.log('  GET  /tables                    - List all tables');
      console.log('  GET  /tables/:tableName         - Describe table schema');
      console.log('  POST /query                     - Run SQL query');
      console.log('  POST /tables/:tableName/insert  - Insert row');
      console.log('  PUT  /tables/:tableName/update  - Update rows');
      console.log('  DELETE /tables/:tableName/delete - Delete rows');
      console.log('');
      console.log('💡 Import the Postman collection from examples/postman-collection.json');
    });
  }
}

// Start the HTTP wrapper
const wrapper = new MCPHTTPWrapper();
wrapper.start();
