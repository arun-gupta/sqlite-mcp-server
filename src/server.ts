#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { MCPContent } from './types/mcp.js';
import type { TableSchema, ColumnInfo } from './types/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class SQLiteMCPServer {
  private server: Server;
  private db: sqlite3.Database | null;
  private dbPath: string;

  constructor() {
    this.server = new Server({
      name: 'sqlite-mcp-server',
      version: '1.0.0',
    });

    this.db = null;
    this.dbPath = process.env.SQLITE_DB_PATH || ':memory:';
    
    this.setupToolHandlers();
    this.setupLogging();
  }

  private setupLogging(): void {
    console.error('[MCP] Logging setup complete');
  }

  private setupToolHandlers(): void {
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

        let result: MCPContent[];
        switch (name) {
          case 'list_tables':
            result = await this.listTables();
            break;
          case 'describe_table':
            if (!args?.table_name || typeof args.table_name !== 'string') {
              throw new Error('table_name is required and must be a string');
            }
            result = await this.describeTable(args.table_name);
            break;
          case 'run_query':
            if (!args?.query || typeof args.query !== 'string') {
              throw new Error('query is required and must be a string');
            }
            result = await this.runQuery(args.query);
            break;
          case 'insert_row':
            if (!args?.table_name || typeof args.table_name !== 'string') {
              throw new Error('table_name is required and must be a string');
            }
            if (!args?.data || typeof args.data !== 'object') {
              throw new Error('data is required and must be an object');
            }
            result = await this.insertRow(args.table_name, args.data as Record<string, any>);
            break;
          case 'update_row':
            if (!args?.table_name || typeof args.table_name !== 'string') {
              throw new Error('table_name is required and must be a string');
            }
            if (!args?.data || typeof args.data !== 'object') {
              throw new Error('data is required and must be an object');
            }
            if (!args?.where || typeof args.where !== 'object') {
              throw new Error('where is required and must be an object');
            }
            result = await this.updateRow(args.table_name, args.data as Record<string, any>, args.where as Record<string, any>);
            break;
          case 'delete_row':
            if (!args?.table_name || typeof args.table_name !== 'string') {
              throw new Error('table_name is required and must be a string');
            }
            if (!args?.where || typeof args.where !== 'object') {
              throw new Error('where is required and must be an object');
            }
            result = await this.deleteRow(args.table_name, args.where as Record<string, any>);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: result,
        };
      } catch (error) {
        console.error(`[ERROR] Tool ${name} failed:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async connectDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.error(`[DB] Connecting to database: ${this.dbPath}`);
        this.db = new sqlite3.Database(this.dbPath, (err) => {
          if (err) {
            console.error(`[DB] Connection failed:`, err);
            reject(err);
          } else {
            // Enable foreign keys
            this.db!.run('PRAGMA foreign_keys = ON', (err) => {
              if (err) {
                console.error(`[DB] Failed to enable foreign keys:`, err);
              }
              
              // Enable WAL mode for better concurrent access
              this.db!.run('PRAGMA journal_mode = WAL', (err) => {
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

  private async listTables(): Promise<MCPContent[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const query = `
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `;
      
      this.db.all(query, [], (err, tables) => {
        if (err) {
          reject(err);
        } else {
          resolve([
            {
              type: 'text',
              text: `Found ${tables.length} tables:\n${tables.map((t: any) => `- ${t.name}`).join('\n')}`,
            },
          ]);
        }
      });
    });
  }

  private async describeTable(tableName: string): Promise<MCPContent[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

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
        
        this.db!.get(createQuery, [tableName], (err, createStmt) => {
          if (err) {
            reject(err);
            return;
          }
          
          const description: TableSchema = {
            name: tableName,
            columns: columns.map((col: any) => ({
              name: col.name,
              type: col.type,
              notNull: col.notnull === 1,
              primaryKey: col.pk === 1,
              defaultValue: col.dflt_value,
            })),
            createSql: (createStmt as any)?.sql || null,
          };
          
          resolve([
            {
              type: 'text',
              text: `Table: ${tableName}\n${JSON.stringify(description, null, 2)}`,
            },
          ]);
        });
      });
    });
  }

  private async runQuery(query: string): Promise<MCPContent[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

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
          resolve([
            {
              type: 'text',
              text: `Query executed successfully. Found ${results.length} rows:\n${JSON.stringify(results, null, 2)}`,
            },
          ]);
        }
      });
    });
  }

  private async insertRow(tableName: string, data: Record<string, any>): Promise<MCPContent[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = columns.map(() => '?').join(', ');
      
      const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
      
      this.db.run(query, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve([
            {
              type: 'text',
              text: `Row inserted successfully. Last insert ID: ${this.lastID}, Changes: ${this.changes}`,
            },
          ]);
        }
      });
    });
  }

  private async updateRow(tableName: string, data: Record<string, any>, where: Record<string, any>): Promise<MCPContent[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

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
          resolve([
            {
              type: 'text',
              text: `Rows updated successfully. Changes: ${this.changes}`,
            },
          ]);
        }
      });
    });
  }

  private async deleteRow(tableName: string, where: Record<string, any>): Promise<MCPContent[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const whereColumns = Object.keys(where);
      const whereValues = Object.values(where);
      
      const whereClause = whereColumns.map(col => `${col} = ?`).join(' AND ');
      const query = `DELETE FROM ${tableName} WHERE ${whereClause}`;
      
      this.db.run(query, whereValues, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve([
            {
              type: 'text',
              text: `Rows deleted successfully. Changes: ${this.changes}`,
            },
          ]);
        }
      });
    });
  }

  public async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[MCP] Server started and listening on stdio');
    
    // Keep the server running and handle multiple requests
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
    process.stdin.resume();
  }
  
  private async cleanup(): Promise<void> {
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
