#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing persistent MCP server...');

// Start the persistent server
const server = spawn('node', ['src/server-persistent.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: __dirname
});

// Handle server output
server.stdout.on('data', (data) => {
  console.log(`[SERVER STDOUT] ${data.toString().trim()}`);
});

server.stderr.on('data', (data) => {
  console.log(`[SERVER STDERR] ${data.toString().trim()}`);
});

// Handle server exit
server.on('close', (code) => {
  console.log(`[SERVER] Process exited with code ${code}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error(`[SERVER ERROR] ${error.message}`);
});

// Keep the test running for a bit to see the server behavior
setTimeout(() => {
  console.log('Sending SIGTERM to server...');
  server.kill('SIGTERM');
}, 10000); // Run for 10 seconds

console.log('Test started. Server should stay running for 10 seconds...');
