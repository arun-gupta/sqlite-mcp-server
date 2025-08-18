#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class SQLiteMCPServer {
  constructor() {
    this.server = new Server(
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

    this.db = null;
    this.dbPath = process.env.SQLITE_DB_PATH || ':memory:';
    
    this.setupToolHandlers();
    this.setupLogging();
  }

  setupLogging() {
    console.error('[MCP] Logging setup complete');
  }

  setupToolHandlers() {
    // List all available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
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
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
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
              
              // Enable WAL mode for better concurrent access
              this.db.run('PRAGMA journal_mode = WAL', (err) => {
                if (err) {
                  console.error('[DB] Warning: Could not enable WAL mode:', err);
                } else {
                  console.error('[DB] WAL mode enabled for better performance');
                }
                console.error(`[DB] Connected successfully`);
                resolve();
              });
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

  async run() {
    // Connect to database first
    await this.connectDatabase();
    
    console.error('[MCP] Server initialized and ready');
    console.error('[MCP] This is a persistent version for testing - use the standard server.js for MCP clients');
    
    // Keep the server running indefinitely
    process.on('SIGINT', () => {
      console.error('[MCP] Received SIGINT, shutting down gracefully...');
      this.cleanup();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.error('[MCP] Received SIGTERM, shutting down gracefully...');
      this.cleanup();
      process.exit(0);
    });
    
    // Keep the process alive
    setInterval(() => {
      // Heartbeat to keep the process alive
      console.error('[MCP] Server heartbeat - still running');
    }, 30000); // Every 30 seconds
  }
  
  async cleanup() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('[DB] Error closing database:', err);
        } else {
          console.error('[DB] Database connection closed');
        }
      });
    }
  }
}

// Start the server
const server = new SQLiteMCPServer();
server.run().catch((error) => {
  console.error('[FATAL] Server failed to start:', error);
  process.exit(1);
});
