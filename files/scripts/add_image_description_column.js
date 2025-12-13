/**
 * Migration: Add image_description column to content_items table
 * Run this inside the n8n Docker container:
 *   docker exec -it n8n-n8n-1 node /data/clients/_config/add_image_description_column.js
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = '/data/clients/_config/socialflow.db';

console.log('='.repeat(50));
console.log('Adding image_description column to content_items');
console.log('='.repeat(50));

let db;
try {
  db = new Database(DB_PATH);

  // Check if column already exists
  const tableInfo = db.prepare("PRAGMA table_info(content_items)").all();
  const hasImageDescription = tableInfo.some(col => col.name === 'image_description');
  const hasDescriptionGeneratedAt = tableInfo.some(col => col.name === 'description_generated_at');

  if (hasImageDescription && hasDescriptionGeneratedAt) {
    console.log('✓ Columns already exist, nothing to do');
  } else {
    // Add columns if they don't exist
    if (!hasImageDescription) {
      db.exec('ALTER TABLE content_items ADD COLUMN image_description TEXT');
      console.log('✓ Added image_description column');
    }

    if (!hasDescriptionGeneratedAt) {
      db.exec('ALTER TABLE content_items ADD COLUMN description_generated_at TEXT');
      console.log('✓ Added description_generated_at column');
    }

    console.log('✓ Migration complete!');
  }

  // Verify
  const newTableInfo = db.prepare("PRAGMA table_info(content_items)").all();
  console.log('\nCurrent content_items columns:');
  newTableInfo.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });

} catch (e) {
  console.error('✗ Error:', e.message);
  process.exit(1);
} finally {
  if (db) db.close();
}

console.log('='.repeat(50));
