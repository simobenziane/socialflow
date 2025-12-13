/**
 * SocialFlow v11 Database Initialization Script
 *
 * This script initializes the SQLite database for SocialFlow v11.
 * Run this once before starting the workflows.
 *
 * Usage:
 *   node init_database.js
 *
 * In n8n (Execute Command node):
 *   node /data/clients/_config/init_database.js
 */

const fs = require('fs');
const path = require('path');

// Configuration - detect environment
const isWindows = process.platform === 'win32';
const SCRIPT_DIR = __dirname;

// Schema is always next to this script
const SCHEMA_PATH = path.join(SCRIPT_DIR, 'schema.sql');

// Config path: use C:\Clients\_config on Windows, /data/clients/_config on Linux/Docker
const CONFIG_PATH = isWindows ? 'C:\\Clients\\_config' : '/data/clients/_config';
const DB_PATH = path.join(CONFIG_PATH, 'socialflow.db');

// Check if better-sqlite3 is available, otherwise use sql.js
let Database;
try {
    Database = require('better-sqlite3');
} catch (e) {
    console.log('better-sqlite3 not found, please install it:');
    console.log('  npm install better-sqlite3');
    process.exit(1);
}

function initializeDatabase() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  SocialFlow v11 - Database Initialization');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    // Check if schema file exists
    if (!fs.existsSync(SCHEMA_PATH)) {
        console.error(`ERROR: Schema file not found at ${SCHEMA_PATH}`);
        console.log('schema.sql should be in the same directory as this script.');
        process.exit(1);
    }

    // Create config directory if it doesn't exist
    if (!fs.existsSync(CONFIG_PATH)) {
        console.log(`Creating config directory: ${CONFIG_PATH}`);
        fs.mkdirSync(CONFIG_PATH, { recursive: true });
        console.log(`✓ Config directory created`);
    }

    // Read schema
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    console.log(`✓ Schema file loaded from ${SCHEMA_PATH}`);

    // Check if database already exists
    const dbExists = fs.existsSync(DB_PATH);
    if (dbExists) {
        console.log(`! Database already exists at ${DB_PATH}`);
        console.log('  Creating backup before updating...');

        const backupPath = `${DB_PATH}.backup.${Date.now()}`;
        fs.copyFileSync(DB_PATH, backupPath);
        console.log(`✓ Backup created: ${backupPath}`);
    }

    // Initialize database
    const db = new Database(DB_PATH);
    console.log(`✓ Database opened: ${DB_PATH}`);

    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    console.log('✓ Foreign keys enabled');

    // Execute schema
    try {
        db.exec(schema);
        console.log('✓ Schema executed successfully');
    } catch (err) {
        console.error('ERROR executing schema:', err.message);
        process.exit(1);
    }

    // Verify tables
    const tables = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
    `).all();

    console.log('');
    console.log('Tables created:');
    tables.forEach(t => console.log(`  - ${t.name}`));

    // Verify indexes
    const indexes = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='index' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
    `).all();

    console.log('');
    console.log('Indexes created:');
    indexes.forEach(i => console.log(`  - ${i.name}`));

    // Close database
    db.close();

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  Database initialization complete!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Run the migration script to import v10 data (optional)');
    console.log('  2. Import the v11 workflows into n8n');
    console.log('  3. Test with: curl -X POST http://localhost:5678/webhook/w1-ingest');
    console.log('');
}

// Run if called directly
if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase, DB_PATH, CONFIG_PATH };
