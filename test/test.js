#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test MCP messages
const testMessages = [
  // Initialize
  {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
      },
      clientInfo: {
        name: 'test-client',
        version: '1.0.0',
      },
    },
  },
  // List tools
  {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {},
  },
  // Call list_tables tool
  {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'list_tables',
      arguments: {},
    },
  },
];

async function testMCPServer() {
  console.log('Starting MCP server test...\n');

  // Start the MCP server
  const serverProcess = spawn('node', [join(__dirname, '../src/server.js')], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let responseCount = 0;

  // Handle server responses
  serverProcess.stdout.on('data', (data) => {
    const responses = data.toString().trim().split('\n');
    
    for (const response of responses) {
      if (response.trim()) {
        try {
          const parsed = JSON.parse(response);
          console.log(`Response ${++responseCount}:`, JSON.stringify(parsed, null, 2));
          console.log('---\n');
        } catch (e) {
          console.log('Raw output:', response);
        }
      }
    }
  });

  // Handle server errors
  serverProcess.stderr.on('data', (data) => {
    console.error('Server stderr:', data.toString());
  });

  // Send test messages
  for (const message of testMessages) {
    console.log(`Sending: ${message.method}`);
    serverProcess.stdin.write(JSON.stringify(message) + '\n');
    
    // Wait a bit between messages
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Close the server after a delay
  setTimeout(() => {
    console.log('Test completed, closing server...');
    serverProcess.kill();
    process.exit(0);
  }, 2000);
}

// Run the test
testMCPServer().catch(console.error);
