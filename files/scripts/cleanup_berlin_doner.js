/**
 * Cleanup Script: Remove Berlin Döner contamination from database
 *
 * Run this inside the n8n Docker container:
 * docker exec -it n8n node /data/clients/_config/scripts/cleanup_berlin_doner.js
 *
 * Or copy to _config folder and run there
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || '/data/clients/_config/socialflow.db';

console.log('=== Berlin Döner Cleanup Script ===');
console.log(`Database: ${DB_PATH}`);

let db;
try {
  db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');

  // 1. Find and report Berlin Döner references in captions
  console.log('\n--- Finding Berlin Döner references ---');

  const berlinItems = db.prepare(`
    SELECT id, content_id, caption_ig, status
    FROM content_items
    WHERE caption_ig LIKE '%Berlin%'
       OR caption_ig LIKE '%berlin%'
       OR caption_ig LIKE '%Döner%'
       OR caption_ig LIKE '%doner%'
       OR caption_ig LIKE '%Germany%'
       OR caption_ig LIKE '%Allemagne%'
  `).all();

  console.log(`Found ${berlinItems.length} items with Berlin/Döner/Germany references`);

  if (berlinItems.length > 0) {
    console.log('\nItems to clean:');
    berlinItems.forEach(item => {
      console.log(`  [${item.id}] ${item.content_id} (${item.status})`);
      console.log(`      Caption: ${item.caption_ig?.substring(0, 80)}...`);
    });
  }

  // 2. Find berlin-doner client
  const berlinClient = db.prepare(`SELECT id, slug, name FROM clients WHERE slug = 'berlin-doner'`).get();

  if (berlinClient) {
    console.log(`\n--- Found berlin-doner client (id: ${berlinClient.id}) ---`);

    // Count related records
    const batchCount = db.prepare('SELECT COUNT(*) as c FROM batches WHERE client_id = ?').get(berlinClient.id);
    const itemCount = db.prepare('SELECT COUNT(*) as c FROM content_items WHERE client_id = ?').get(berlinClient.id);
    const convCount = db.prepare('SELECT COUNT(*) as c FROM ai_conversations WHERE content_id IN (SELECT id FROM content_items WHERE client_id = ?)').get(berlinClient.id);

    console.log(`  Batches: ${batchCount.c}`);
    console.log(`  Content items: ${itemCount.c}`);
    console.log(`  AI conversations: ${convCount.c}`);

    // Delete in correct order (foreign keys)
    console.log('\nDeleting berlin-doner data...');

    // Delete AI conversations for berlin-doner items
    const delConv = db.prepare(`
      DELETE FROM ai_conversations
      WHERE content_id IN (SELECT id FROM content_items WHERE client_id = ?)
    `).run(berlinClient.id);
    console.log(`  Deleted ${delConv.changes} AI conversations`);

    // Delete content items
    const delItems = db.prepare('DELETE FROM content_items WHERE client_id = ?').run(berlinClient.id);
    console.log(`  Deleted ${delItems.changes} content items`);

    // Delete batches
    const delBatches = db.prepare('DELETE FROM batches WHERE client_id = ?').run(berlinClient.id);
    console.log(`  Deleted ${delBatches.changes} batches`);

    // Delete agent instructions
    const delInstr = db.prepare(`
      DELETE FROM agent_instructions
      WHERE (scope = 'client' AND scope_id = ?)
         OR (scope = 'batch' AND scope_id IN (SELECT id FROM batches WHERE client_id = ?))
    `).run(berlinClient.id, berlinClient.id);
    console.log(`  Deleted ${delInstr.changes} agent instructions`);

    // Delete accounts
    const delAccounts = db.prepare('DELETE FROM accounts WHERE client_id = ?').run(berlinClient.id);
    console.log(`  Deleted ${delAccounts.changes} accounts`);

    // Delete client
    const delClient = db.prepare('DELETE FROM clients WHERE id = ?').run(berlinClient.id);
    console.log(`  Deleted ${delClient.changes} client`);

  } else {
    console.log('\n--- berlin-doner client not found in database ---');
  }

  // 3. Reset contaminated captions to NEEDS_AI
  if (berlinItems.length > 0) {
    console.log('\n--- Resetting contaminated items to NEEDS_AI ---');

    const resetStmt = db.prepare(`
      UPDATE content_items
      SET status = 'NEEDS_AI',
          caption_ig = NULL,
          caption_tt = NULL,
          updated_at = datetime('now')
      WHERE id = ?
    `);

    let resetCount = 0;
    for (const item of berlinItems) {
      // Only reset if it's not from berlin-doner (already deleted)
      const exists = db.prepare('SELECT id FROM content_items WHERE id = ?').get(item.id);
      if (exists) {
        resetStmt.run(item.id);
        resetCount++;
        console.log(`  Reset: ${item.content_id}`);
      }
    }

    console.log(`\nReset ${resetCount} items to NEEDS_AI`);
  }

  // 4. Clean up any orphaned AI conversations
  const orphanedConv = db.prepare(`
    DELETE FROM ai_conversations
    WHERE content_id NOT IN (SELECT id FROM content_items)
  `).run();

  if (orphanedConv.changes > 0) {
    console.log(`\nCleaned up ${orphanedConv.changes} orphaned AI conversations`);
  }

  console.log('\n=== Cleanup Complete ===');

} catch (e) {
  console.error(`Error: ${e.message}`);
  process.exit(1);
} finally {
  if (db) db.close();
}
