#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database path - can be overridden by environment variable
const dbPath: string = process.env.SQLITE_DB_PATH || join(__dirname, '../test.db');

console.log(`Setting up database at: ${dbPath}`);

// Create database and tables
const db: sqlite3.Database = new sqlite3.Database(dbPath, (err: Error | null) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  
  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON', (err: Error | null) => {
    if (err) {
      console.error('Error enabling foreign keys:', err);
    }
  });
});

// Helper function to run SQL statements
function runSQL(sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, (err: Error | null) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// Helper function to insert data
function insertData(sql: string, params: any[]): Promise<sqlite3.RunResult> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err: Error | null) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
}

async function setupDatabase(): Promise<void> {
  try {
    // Create tables
    await runSQL(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        active INTEGER DEFAULT 1
      )
    `);

    await runSQL(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        published INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    await runSQL(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT
      )
    `);

    await runSQL(`
      CREATE TABLE IF NOT EXISTS post_categories (
        post_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        PRIMARY KEY (post_id, category_id),
        FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
      )
    `);

    // Insert sample data
    await insertData('INSERT OR IGNORE INTO users (name, email) VALUES (?, ?)', ['John Doe', 'john@example.com']);
    await insertData('INSERT OR IGNORE INTO users (name, email) VALUES (?, ?)', ['Jane Smith', 'jane@example.com']);
    await insertData('INSERT OR IGNORE INTO users (name, email) VALUES (?, ?)', ['Bob Johnson', 'bob@example.com']);

    await insertData('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)', ['Technology', 'Technology-related posts']);
    await insertData('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)', ['Travel', 'Travel and adventure posts']);
    await insertData('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)', ['Food', 'Food and cooking posts']);

    await insertData('INSERT OR IGNORE INTO posts (user_id, title, content, published) VALUES (?, ?, ?, ?)', [1, 'Getting Started with SQLite', 'SQLite is a great database for...', 1]);
    await insertData('INSERT OR IGNORE INTO posts (user_id, title, content, published) VALUES (?, ?, ?, ?)', [1, 'MCP Protocol Overview', 'The Model Context Protocol...', 1]);
    await insertData('INSERT OR IGNORE INTO posts (user_id, title, content, published) VALUES (?, ?, ?, ?)', [2, 'My Trip to Paris', 'Last summer I visited Paris...', 1]);
    await insertData('INSERT OR IGNORE INTO posts (user_id, title, content, published) VALUES (?, ?, ?, ?)', [3, 'Best Pizza Recipe', 'Here is my secret pizza recipe...', 0]);

    await insertData('INSERT OR IGNORE INTO post_categories (post_id, category_id) VALUES (?, ?)', [1, 1]); // SQLite post -> Technology
    await insertData('INSERT OR IGNORE INTO post_categories (post_id, category_id) VALUES (?, ?)', [2, 1]); // MCP post -> Technology
    await insertData('INSERT OR IGNORE INTO post_categories (post_id, category_id) VALUES (?, ?)', [3, 2]); // Paris post -> Travel
    await insertData('INSERT OR IGNORE INTO post_categories (post_id, category_id) VALUES (?, ?)', [4, 3]); // Pizza post -> Food

    console.log('Database setup completed successfully!');
    console.log('\nSample data inserted:');
    console.log('- 3 users');
    console.log('- 3 categories');
    console.log('- 4 posts');
    console.log('- 4 post-category relationships');

    // Show some sample queries
    console.log('\nSample queries you can try:');
    console.log('1. List all tables: list_tables');
    console.log('2. Describe users table: describe_table with table_name="users"');
    console.log('3. Get all active users: SELECT * FROM users WHERE active = 1');
    console.log('4. Get posts with author names: SELECT p.title, u.name FROM posts p JOIN users u ON p.user_id = u.id');

  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    db.close((err: Error | null) => {
      if (err) {
        console.error('Error closing database:', err);
      }
    });
  }
}

// Run the setup
setupDatabase();
