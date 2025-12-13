/**
 * Create agent_instructions table for Phase 3 AI instruction cascade
 */
const Database = require('better-sqlite3');

const DB_PATH = '/data/clients/_config/socialflow.db';
const db = new Database(DB_PATH);

// Check if table exists
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='agent_instructions'").all();

if (tables.length === 0) {
  console.log('Creating agent_instructions table...');

  db.exec(`
    CREATE TABLE agent_instructions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_type TEXT NOT NULL,
      scope TEXT NOT NULL,
      scope_id INTEGER,
      instruction_key TEXT NOT NULL,
      instruction_value TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(agent_type, scope, scope_id, instruction_key)
    )
  `);

  // Create index for efficient lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_agent_instructions_lookup
    ON agent_instructions(agent_type, scope, scope_id, is_active)
  `);

  console.log('✓ agent_instructions table created');

  // Show the new table structure
  const cols = db.prepare('PRAGMA table_info(agent_instructions)').all();
  console.log('');
  console.log('Columns:');
  cols.forEach(c => console.log('  - ' + c.name + ' (' + (c.type || 'NULL') + ')'));
} else {
  console.log('agent_instructions table already exists');

  // Show existing structure
  const cols = db.prepare('PRAGMA table_info(agent_instructions)').all();
  console.log('');
  console.log('Existing columns:');
  cols.forEach(c => console.log('  - ' + c.name + ' (' + (c.type || 'NULL') + ')'));
}

db.close();
console.log('');
console.log('Done!');
