#!/usr/bin/env node

import express, { Request, Response, NextFunction } from 'express';
import { spawn, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { 
  MCPRequest, 
  MCPResponse, 
  MCPInitializeRequest,
  MCPToolListRequest,
  MCPToolCallRequest 
} from './types/mcp.js';
import type { 
  HealthResponse, 
  ServerInfoResponse,
  HTTPResponse 
} from './types/http.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MCPHTTPWrapper {
  private app: express.Application;
  private port: number;
  private mcpServer: ChildProcess | null;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.HTTP_PORT || '4000', 10);
    this.mcpServer = null;
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS for Postman
    this.app.use((req: Request, res: Response, next: NextFunction) => {
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
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`[HTTP] ${req.method} ${req.path}`, req.body);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      const response: HealthResponse = { 
        status: 'ok', 
        service: 'sqlite-mcp-http-wrapper',
        timestamp: new Date().toISOString()
      };
      res.json(response);
    });

    // Get server info
    this.app.get('/info', async (req: Request, res: Response) => {
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
        } as MCPInitializeRequest);
        res.json(result);
      } catch (error) {
        res.status(500).json({ 
          success: false,
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    });

    // List available tools
    this.app.get('/tools', async (req: Request, res: Response) => {
      try {
        const result = await this.sendMCPMessage({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/list',
          params: {}
        } as MCPToolListRequest);
        res.json(result);
      } catch (error) {
        res.status(500).json({ 
          success: false,
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    });

    // Execute a tool
    this.app.post('/tools/:toolName', async (req: Request, res: Response) => {
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
        } as MCPToolCallRequest);
        res.json(result);
      } catch (error) {
        res.status(500).json({ 
          success: false,
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    });

    // List all tables
    this.app.get('/tables', async (req: Request, res: Response) => {
      try {
        const result = await this.sendMCPMessage({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: 'list_tables',
            arguments: {}
          }
        } as MCPToolCallRequest);
        res.json(result);
      } catch (error) {
        res.status(500).json({ 
          success: false,
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    });

    // Describe table schema
    this.app.get('/tables/:tableName', async (req: Request, res: Response) => {
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
        } as MCPToolCallRequest);
        res.json(result);
      } catch (error) {
        res.status(500).json({ 
          success: false,
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    });

    // Run SQL query
    this.app.post('/query', async (req: Request, res: Response) => {
      try {
        const { query } = req.body;
        if (!query || typeof query !== 'string') {
          res.status(400).json({ 
            success: false,
            error: 'Query is required and must be a string' 
          });
          return;
        }

        const result = await this.sendMCPMessage({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: 'run_query',
            arguments: { query }
          }
        } as MCPToolCallRequest);
        res.json(result);
      } catch (error) {
        res.status(500).json({ 
          success: false,
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    });

    // Insert row
    this.app.post('/tables/:tableName/insert', async (req: Request, res: Response) => {
      try {
        const { tableName } = req.params;
        const { data } = req.body;
        
        if (!data || typeof data !== 'object') {
          res.status(400).json({ 
            success: false,
            error: 'Data is required and must be an object' 
          });
          return;
        }

        const result = await this.sendMCPMessage({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: 'insert_row',
            arguments: { table_name: tableName, data }
          }
        } as MCPToolCallRequest);
        res.json(result);
      } catch (error) {
        res.status(500).json({ 
          success: false,
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    });

    // Update rows
    this.app.put('/tables/:tableName/update', async (req: Request, res: Response) => {
      try {
        const { tableName } = req.params;
        const { data, where } = req.body;
        
        if (!data || typeof data !== 'object') {
          res.status(400).json({ 
            success: false,
            error: 'Data is required and must be an object' 
          });
          return;
        }
        
        if (!where || typeof where !== 'object') {
          res.status(400).json({ 
            success: false,
            error: 'Where clause is required and must be an object' 
          });
          return;
        }

        const result = await this.sendMCPMessage({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: 'update_row',
            arguments: { table_name: tableName, data, where }
          }
        } as MCPToolCallRequest);
        res.json(result);
      } catch (error) {
        res.status(500).json({ 
          success: false,
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    });

    // Delete rows
    this.app.delete('/tables/:tableName/delete', async (req: Request, res: Response) => {
      try {
        const { tableName } = req.params;
        const { where } = req.body;
        
        if (!where || typeof where !== 'object') {
          res.status(400).json({ 
            success: false,
            error: 'Where clause is required and must be an object' 
          });
          return;
        }

        const result = await this.sendMCPMessage({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: 'delete_row',
            arguments: { table_name: tableName, where }
          }
        } as MCPToolCallRequest);
        res.json(result);
      } catch (error) {
        res.status(500).json({ 
          success: false,
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    });
  }

  private async sendMCPMessage(message: MCPRequest): Promise<MCPResponse> {
    return new Promise((resolve, reject) => {
      if (!this.mcpServer) {
        // Start the MCP server process
        this.mcpServer = spawn('node', ['server.js'], {
          stdio: ['pipe', 'pipe', 'pipe'],
          cwd: __dirname
        });

        this.mcpServer.on('error', (error) => {
          console.error('[HTTP] MCP server error:', error);
          reject(error);
        });

        this.mcpServer.on('exit', (code) => {
          console.error(`[HTTP] MCP server exited with code ${code}`);
          this.mcpServer = null;
        });
      }

      let responseData = '';
      let errorData = '';

      this.mcpServer!.stdout?.on('data', (data) => {
        responseData += data.toString();
      });

      this.mcpServer!.stderr?.on('data', (data) => {
        errorData += data.toString();
      });

      this.mcpServer!.stdout?.once('end', () => {
        try {
          const response = JSON.parse(responseData);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse MCP response: ${errorData}`));
        }
      });

      // Send the message to the MCP server
      this.mcpServer!.stdin?.write(JSON.stringify(message) + '\n');
      this.mcpServer!.stdin?.end();
    });
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log('🚀 HTTP Wrapper started on http://localhost:' + this.port);
      console.log('📊 Database:', process.env.SQLITE_DB_PATH || '/data/database.db');
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
