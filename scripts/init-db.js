#!/usr/bin/env node
/**
 * SocialFlow Database Initialization Script
 * Uses better-sqlite3 since n8n image doesn't have sqlite3 CLI
 */

// Load from /opt/node-libs where it's installed in the Docker image
const Database = require('/opt/node-libs/node_modules/better-sqlite3');
const fs = require('fs');
const path = require('path');

const CONFIG_DIR = '/data/clients/_config';
const DB_PATH = path.join(CONFIG_DIR, 'socialflow.db');
const SCHEMA_PATH = '/opt/scripts/schema.sql';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  SocialFlow - Database Initialization (Node.js)');
console.log('═══════════════════════════════════════════════════════════════');

// Create directory if needed
if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    console.log(`Created: ${CONFIG_DIR}`);
}

// Check if database already exists
if (fs.existsSync(DB_PATH)) {
    console.log(`Database already exists: ${DB_PATH}`);
    process.exit(0);
}

// Read schema
if (!fs.existsSync(SCHEMA_PATH)) {
    console.error(`Schema file not found: ${SCHEMA_PATH}`);
    process.exit(1);
}

const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

// Initialize database
try {
    const db = new Database(DB_PATH);
    db.pragma('foreign_keys = ON');
    db.exec(schema);
    db.close();
    console.log(`✓ Database initialized: ${DB_PATH}`);
} catch (error) {
    console.error('Failed to initialize database:', error.message);
    process.exit(1);
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('  Database initialization complete!');
console.log('═══════════════════════════════════════════════════════════════');
