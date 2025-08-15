#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DualMCPServer {
  constructor() {
    this.mcpServer = new Server(
      {
        name: 'sqlite-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.httpApp = express();
    this.port = process.env.HTTP_PORT || 4000;
    this.db = null;
    this.dbPath = process.env.SQLITE_DB_PATH || ':memory:';
    
    this.setupMCPHandlers();
    this.setupHTTPHandlers();
    this.setupLogging();
  }

  setupLogging() {
    console.error('[DUAL] Logging setup complete');
  }

  setupMCPHandlers() {
    // List all available tools
    this.mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'list_tables',
            description: 'List all tables in the SQLite database',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          {
            name: 'describe_table',
            description: 'Describe the schema of a specific table',
            inputSchema: {
              type: 'object',
              properties: {
                table_name: {
                  type: 'string',
                  description: 'Name of the table to describe',
                },
              },
              required: ['table_name'],
            },
          },
          {
            name: 'run_query',
            description: 'Run a SELECT query and return results as JSON',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'SQL SELECT query to execute',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'insert_row',
            description: 'Insert a new row into a table',
            inputSchema: {
              type: 'object',
              properties: {
                table_name: {
                  type: 'string',
                  description: 'Name of the table to insert into',
                },
                data: {
                  type: 'object',
                  description: 'Column names and values to insert',
                },
              },
              required: ['table_name', 'data'],
            },
          },
          {
            name: 'update_row',
            description: 'Update rows in a table based on a condition',
            inputSchema: {
              type: 'object',
              properties: {
                table_name: {
                  type: 'string',
                  description: 'Name of the table to update',
                },
                data: {
                  type: 'object',
                  description: 'Column names and new values',
                },
                where: {
                  type: 'object',
                  description: 'WHERE conditions (column: value pairs)',
                },
              },
              required: ['table_name', 'data', 'where'],
            },
          },
          {
            name: 'delete_row',
            description: 'Delete rows from a table based on a condition',
            inputSchema: {
              type: 'object',
              properties: {
                table_name: {
                  type: 'string',
                  description: 'Name of the table to delete from',
                },
                where: {
                  type: 'object',
                  description: 'WHERE conditions (column: value pairs)',
                },
              },
              required: ['table_name', 'where'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Ensure database connection
        if (!this.db) {
          await this.connectDatabase();
        }

        switch (name) {
          case 'list_tables':
            return await this.listTables();
          case 'describe_table':
            return await this.describeTable(args.table_name);
          case 'run_query':
            return await this.runQuery(args.query);
          case 'insert_row':
            return await this.insertRow(args.table_name, args.data);
          case 'update_row':
            return await this.updateRow(args.table_name, args.data, args.where);
          case 'delete_row':
            return await this.deleteRow(args.table_name, args.where);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`[ERROR] Tool ${name} failed:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  setupHTTPHandlers() {
    this.httpApp.use(express.json());
    this.httpApp.use(express.urlencoded({ extended: true }));
    
    // CORS for Postman
    this.httpApp.use((req, res, next) => {
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
    this.httpApp.use((req, res, next) => {
      console.error(`[HTTP] ${req.method} ${req.path}`, req.body);
      next();
    });

    // Health check
    this.httpApp.get('/health', (req, res) => {
      res.json({ status: 'ok', service: 'sqlite-mcp-dual-server' });
    });

    // Get server info
    this.httpApp.get('/info', async (req, res) => {
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
    this.httpApp.get('/tools', async (req, res) => {
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
    this.httpApp.post('/tools/:toolName', async (req, res) => {
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

    // Convenience endpoints
    this.httpApp.get('/tables', async (req, res) => {
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

    this.httpApp.get('/tables/:tableName', async (req, res) => {
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

    this.httpApp.post('/query', async (req, res) => {
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

    this.httpApp.post('/tables/:tableName/insert', async (req, res) => {
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

    this.httpApp.put('/tables/:tableName/update', async (req, res) => {
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

    this.httpApp.delete('/tables/:tableName/delete', async (req, res) => {
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
    this.httpApp.use('*', (req, res) => {
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
    // Use the internal MCP server directly
    return await this.mcpServer.handleRequest(message);
  }

  async connectDatabase() {
    return new Promise((resolve, reject) => {
      try {
        console.error(`[DB] Connecting to database: ${this.dbPath}`);
        this.db = new sqlite3.Database(this.dbPath, (err) => {
          if (err) {
            console.error(`[DB] Connection failed:`, err);
            reject(err);
          } else {
            // Enable foreign keys
            this.db.run('PRAGMA foreign_keys = ON', (err) => {
              if (err) {
                console.error(`[DB] Failed to enable foreign keys:`, err);
              }
              console.error(`[DB] Connected successfully`);
              resolve();
            });
          }
        });
      } catch (error) {
        console.error(`[DB] Connection failed:`, error);
        reject(error);
      }
    });
  }

  async listTables() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `;
      
      this.db.all(query, [], (err, tables) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            content: [
              {
                type: 'text',
                text: `Found ${tables.length} tables:\n${tables.map(t => `- ${t.name}`).join('\n')}`,
              },
            ],
          });
        }
      });
    });
  }

  async describeTable(tableName) {
    return new Promise((resolve, reject) => {
      // Get table schema
      const schemaQuery = `PRAGMA table_info(${tableName})`;
      
      this.db.all(schemaQuery, [], (err, columns) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Get table creation SQL
        const createQuery = `
          SELECT sql FROM sqlite_master 
          WHERE type='table' AND name = ?
        `;
        
        this.db.get(createQuery, [tableName], (err, createStmt) => {
          if (err) {
            reject(err);
            return;
          }
          
          const description = {
            table_name: tableName,
            columns: columns.map(col => ({
              name: col.name,
              type: col.type,
              not_null: col.notnull === 1,
              primary_key: col.pk === 1,
              default_value: col.dflt_value,
            })),
            create_sql: createStmt?.sql || null,
          };
          
          resolve({
            content: [
              {
                type: 'text',
                text: `Table: ${tableName}\n${JSON.stringify(description, null, 2)}`,
              },
            ],
          });
        });
      });
    });
  }

  async runQuery(query) {
    return new Promise((resolve, reject) => {
      // Basic validation - only allow SELECT queries
      const trimmedQuery = query.trim().toLowerCase();
      if (!trimmedQuery.startsWith('select')) {
        reject(new Error('Only SELECT queries are allowed for security reasons'));
        return;
      }

      this.db.all(query, [], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            content: [
              {
                type: 'text',
                text: `Query executed successfully. Found ${results.length} rows:\n${JSON.stringify(results, null, 2)}`,
              },
            ],
          });
        }
      });
    });
  }

  async insertRow(tableName, data) {
    return new Promise((resolve, reject) => {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = columns.map(() => '?').join(', ');
      
      const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
      
      this.db.run(query, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            content: [
              {
                type: 'text',
                text: `Row inserted successfully. Last insert ID: ${this.lastID}, Changes: ${this.changes}`,
              },
            ],
          });
        }
      });
    });
  }

  async updateRow(tableName, data, where) {
    return new Promise((resolve, reject) => {
      const setColumns = Object.keys(data);
      const setValues = Object.values(data);
      const whereColumns = Object.keys(where);
      const whereValues = Object.values(where);
      
      const setClause = setColumns.map(col => `${col} = ?`).join(', ');
      const whereClause = whereColumns.map(col => `${col} = ?`).join(' AND ');
      
      const query = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
      
      this.db.run(query, [...setValues, ...whereValues], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            content: [
              {
                type: 'text',
                text: `Rows updated successfully. Changes: ${this.changes}`,
              },
            ],
          });
        }
      });
    });
  }

  async deleteRow(tableName, where) {
    return new Promise((resolve, reject) => {
      const whereColumns = Object.keys(where);
      const whereValues = Object.values(where);
      
      const whereClause = whereColumns.map(col => `${col} = ?`).join(' AND ');
      const query = `DELETE FROM ${tableName} WHERE ${whereClause}`;
      
      this.db.run(query, whereValues, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            content: [
              {
                type: 'text',
                text: `Rows deleted successfully. Changes: ${this.changes}`,
              },
            ],
          });
        }
      });
    });
  }

  async start() {
    // Start HTTP server
    this.httpApp.listen(this.port, () => {
      console.error(`🚀 Dual MCP/HTTP Server started`);
      console.error(`🌐 HTTP API: http://localhost:${this.port}`);
      console.error(`🔧 MCP Protocol: Available via stdio`);
      console.error(`📊 Database: ${this.dbPath}`);
      console.error('');
      console.error('📋 Available HTTP endpoints:');
      console.error('  GET  /health                    - Health check');
      console.error('  GET  /info                      - Server info');
      console.error('  GET  /tools                     - List available tools');
      console.error('  POST /tools/:toolName           - Execute specific tool');
      console.error('  GET  /tables                    - List all tables');
      console.error('  GET  /tables/:tableName         - Describe table schema');
      console.error('  POST /query                     - Run SQL query');
      console.error('  POST /tables/:tableName/insert  - Insert row');
      console.error('  PUT  /tables/:tableName/update  - Update rows');
      console.error('  DELETE /tables/:tableName/delete - Delete rows');
      console.error('');
      console.error('💡 Import the Postman collection from examples/postman-collection.json');
    });

    // Start MCP server
    const transport = new StdioServerTransport();
    await this.mcpServer.connect(transport);
    console.error('[MCP] Server started and listening on stdio');
  }
}

// Start the dual server
const server = new DualMCPServer();
server.start().catch((error) => {
  console.error('[FATAL] Server failed to start:', error);
  process.exit(1);
});
