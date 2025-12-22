#!/usr/bin/env node
/**
 * Fix schedule handler - move it inside batches section
 * The handler at line 2068 is unreachable because it's outside the batches section
 */

const fs = require('fs');
const path = require('path');

const wfPath = path.join(__dirname, '..', 'workflows', '00_API_Endpoints_v17.json');
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));
const node = wf.nodes.find(n => n.name === 'Route Handler');

if (!node) {
  console.error('Route Handler node not found');
  process.exit(1);
}

let code = node.parameters.jsCode;
const lines = code.split('\n');

console.log('Original lines:', lines.length);

// Find the PUT handler end line
let putEndIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("method === 'PUT' && parts.length === 3") &&
      !lines[i].includes('platforms')) {
    // Found PUT handler start, now find its end
    let depth = 0;
    for (let j = i; j < lines.length; j++) {
      const line = lines[j];
      depth += (line.match(/{/g) || []).length;
      depth -= (line.match(/}/g) || []).length;
      if (depth === 0 && j > i) {
        putEndIdx = j;
        break;
      }
    }
    break;
  }
}

if (putEndIdx === -1) {
  console.error('Could not find PUT handler end');
  process.exit(1);
}

console.log('PUT handler ends at line:', putEndIdx + 1);
console.log('Line content:', lines[putEndIdx].substring(0, 50));

// Find the existing schedule handler
let scheduleStartIdx = -1;
let scheduleEndIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("parts[3] === 'schedule'") &&
      lines[i].includes("method === 'POST'") &&
      lines[i].includes("parts[0] === 'batches'")) {
    // Found schedule handler start
    scheduleStartIdx = i;
    // Also include the comment lines above
    while (scheduleStartIdx > 0 &&
           (lines[scheduleStartIdx - 1].includes('BATCH SCHEDULE') ||
            lines[scheduleStartIdx - 1].includes('────'))) {
      scheduleStartIdx--;
    }

    // Find end by tracking braces
    let depth = 0;
    for (let j = i; j < lines.length; j++) {
      const line = lines[j];
      depth += (line.match(/{/g) || []).length;
      depth -= (line.match(/}/g) || []).length;
      if (depth === 0 && j > i) {
        scheduleEndIdx = j;
        break;
      }
    }
    break;
  }
}

if (scheduleStartIdx === -1) {
  console.error('Could not find schedule handler');
  process.exit(1);
}

console.log('Schedule handler from line', scheduleStartIdx + 1, 'to', scheduleEndIdx + 1);

// Build new schedule handler with corrected condition
const newScheduleHandler = `  // ─────────────────────────────────────────────────────────────
  // POST /batches/:client/:batch/schedule - Bulk update content schedules (v17)
  // ─────────────────────────────────────────────────────────────
  else if (method === 'POST' && parts.length === 4 && parts[3] === 'schedule') {
    const clientSlug = parts[1];
    const batchSlug = parts[2];
    const db = new Database(db_path);
    db.pragma('foreign_keys = ON');

    try {
      const batch = db.prepare(\`
        SELECT b.id FROM batches b
        JOIN clients c ON b.client_id = c.id
        WHERE c.slug = ? AND b.slug = ?
      \`).get(clientSlug, batchSlug);

      if (!batch) {
        result = error(\`Batch not found: \${clientSlug}/\${batchSlug}\`, 404);
      } else if (!Array.isArray(body.items) || body.items.length === 0) {
        result = error('items array is required', 400);
      } else {
        // Validate all schedule items before processing
        try {
          for (const item of body.items) {
            validateScheduleItem(item);
          }
        } catch (validationError) {
          result = error(validationError.message, 400);
          db.close();
          return [{ json: result }];
        }

        const timezone = body.timezone || 'Europe/Berlin';
        const updateStmt = db.prepare(\`
          UPDATE content_items
          SET scheduled_date = ?,
              scheduled_time = ?,
              schedule_at = ?,
              slot = ?,
              updated_at = datetime('now')
          WHERE (id = ? OR content_id = ?)
            AND batch_id = ?
            AND status IN ('APPROVED', 'SCHEDULED')
        \`);

        let updated = 0;
        const updateMany = db.transaction((items) => {
          for (const item of items) {
            const scheduleAt = \`\${item.scheduled_date}T\${item.scheduled_time}\`;
            const info = updateStmt.run(
              item.scheduled_date,
              item.scheduled_time,
              scheduleAt,
              item.slot || 'feed',
              item.id, String(item.id),
              batch.id
            );
            if (info.changes > 0) updated++;
          }
        });

        updateMany(body.items);

        result = success({ updated, total: body.items.length }, \`Updated schedule for \${updated} items\`);
      }
    } finally {
      db.close();
    }
  }`;

// Build new code:
// 1. Lines 0 to putEndIdx (inclusive)
// 2. New schedule handler
// 3. Rest of code, skipping old schedule handler

const newLines = [];

// Part 1: Everything up to and including PUT handler end
for (let i = 0; i <= putEndIdx; i++) {
  newLines.push(lines[i]);
}

// Part 2: New schedule handler
newLines.push(newScheduleHandler);

// Part 3: Rest of code, skipping old schedule handler
for (let i = putEndIdx + 1; i < lines.length; i++) {
  // Skip the old schedule handler section
  if (i >= scheduleStartIdx && i <= scheduleEndIdx) continue;
  newLines.push(lines[i]);
}

const newCode = newLines.join('\n');
console.log('New lines:', newCode.split('\n').length);

// Verify syntax
try {
  new Function(newCode);
  console.log('✓ Syntax is valid');
} catch (e) {
  console.error('✗ Syntax error:', e.message);
  console.error('First error near:', e.stack?.split('\n')[1] || 'unknown');
  process.exit(1);
}

// Save
node.parameters.jsCode = newCode;
fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2));
console.log('✓ Workflow saved to', wfPath);

console.log('\n✓ Schedule handler moved inside batches section');
console.log('Re-import the workflow in n8n to apply changes.');
