# MCP Message Examples

This document contains example request and response payloads for the SQLite MCP server.

## Initialization

### Request
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {}
    },
    "clientInfo": {
      "name": "test-client",
      "version": "1.0.0"
    }
  }
}
```

### Response
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {}
    },
    "serverInfo": {
      "name": "sqlite-mcp-server",
      "version": "1.0.0"
    }
  }
}
```

## List Tools

### Request
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list",
  "params": {}
}
```

### Response
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "list_tables",
        "description": "List all tables in the SQLite database",
        "inputSchema": {
          "type": "object",
          "properties": {},
          "required": []
        }
      },
      {
        "name": "describe_table",
        "description": "Describe the schema of a specific table",
        "inputSchema": {
          "type": "object",
          "properties": {
            "table_name": {
              "type": "string",
              "description": "Name of the table to describe"
            }
          },
          "required": ["table_name"]
        }
      },
      {
        "name": "run_query",
        "description": "Run a SELECT query and return results as JSON",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "SQL SELECT query to execute"
            }
          },
          "required": ["query"]
        }
      },
      {
        "name": "insert_row",
        "description": "Insert a new row into a table",
        "inputSchema": {
          "type": "object",
          "properties": {
            "table_name": {
              "type": "string",
              "description": "Name of the table to insert into"
            },
            "data": {
              "type": "object",
              "description": "Column names and values to insert"
            }
          },
          "required": ["table_name", "data"]
        }
      },
      {
        "name": "update_row",
        "description": "Update rows in a table based on a condition",
        "inputSchema": {
          "type": "object",
          "properties": {
            "table_name": {
              "type": "string",
              "description": "Name of the table to update"
            },
            "data": {
              "type": "object",
              "description": "Column names and new values"
            },
            "where": {
              "type": "object",
              "description": "WHERE conditions (column: value pairs)"
            }
          },
          "required": ["table_name", "data", "where"]
        }
      },
      {
        "name": "delete_row",
        "description": "Delete rows from a table based on a condition",
        "inputSchema": {
          "type": "object",
          "properties": {
            "table_name": {
              "type": "string",
              "description": "Name of the table to delete from"
            },
            "where": {
              "type": "object",
              "description": "WHERE conditions (column: value pairs)"
            }
          },
          "required": ["table_name", "where"]
        }
      }
    ]
  }
}
```

## List Tables

### Request
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "list_tables",
    "arguments": {}
  }
}
```

### Response
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Found 2 tables:\n- users\n- posts"
      }
    ]
  }
}
```

## Describe Table

### Request
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "describe_table",
    "arguments": {
      "table_name": "users"
    }
  }
}
```

### Response
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Table: users\n{\n  \"table_name\": \"users\",\n  \"columns\": [\n    {\n      \"name\": \"id\",\n      \"type\": \"INTEGER\",\n      \"not_null\": true,\n      \"primary_key\": true,\n      \"default_value\": null\n    },\n    {\n      \"name\": \"name\",\n      \"type\": \"TEXT\",\n      \"not_null\": true,\n      \"primary_key\": false,\n      \"default_value\": null\n    },\n    {\n      \"name\": \"email\",\n      \"type\": \"TEXT\",\n      \"not_null\": false,\n      \"primary_key\": false,\n      \"default_value\": null\n    }\n  ],\n  \"create_sql\": \"CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT)\"\n}"
      }
    ]
  }
}
```

## Run Query

### Request
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "run_query",
    "arguments": {
      "query": "SELECT * FROM users WHERE id = 1"
    }
  }
}
```

### Response
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Query executed successfully. Found 1 rows:\n[\n  {\n    \"id\": 1,\n    \"name\": \"John Doe\",\n    \"email\": \"john@example.com\"\n  }\n]"
      }
    ]
  }
}
```

## Insert Row

### Request
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "tools/call",
  "params": {
    "name": "insert_row",
    "arguments": {
      "table_name": "users",
      "data": {
        "name": "Jane Smith",
        "email": "jane@example.com"
      }
    }
  }
}
```

### Response
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Row inserted successfully. Last insert ID: 2, Changes: 1"
      }
    ]
  }
}
```

## Update Row

### Request
```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "update_row",
    "arguments": {
      "table_name": "users",
      "data": {
        "email": "john.doe@example.com"
      },
      "where": {
        "id": 1
      }
    }
  }
}
```

### Response
```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Rows updated successfully. Changes: 1"
      }
    ]
  }
}
```

## Delete Row

### Request
```json
{
  "jsonrpc": "2.0",
  "id": 8,
  "method": "tools/call",
  "params": {
    "name": "delete_row",
    "arguments": {
      "table_name": "users",
      "where": {
        "id": 2
      }
    }
  }
}
```

### Response
```json
{
  "jsonrpc": "2.0",
  "id": 8,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Rows deleted successfully. Changes: 1"
      }
    ]
  }
}
```

## Error Response Example

### Request (Invalid query)
```json
{
  "jsonrpc": "2.0",
  "id": 9,
  "method": "tools/call",
  "params": {
    "name": "run_query",
    "arguments": {
      "query": "DELETE FROM users"
    }
  }
}
```

### Response
```json
{
  "jsonrpc": "2.0",
  "id": 9,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Error executing run_query: Only SELECT queries are allowed for security reasons"
      }
    ],
    "isError": true
  }
}
```
