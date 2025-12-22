#!/usr/bin/env node
/**
 * Fix Late Scheduling workflow preflight handling
 *
 * Bug: When Prepare Late Data returns early (empty caption, etc.),
 * the item still goes to Create Late Post because Pre-flight OK?
 * doesn't check _preflight_failed flag.
 *
 * Fix:
 * 1. Add _preflight_ok: false to early returns in Prepare Late Data
 * 2. Make Check Pre-flight Result respect _preflight_failed flag
 */

const fs = require('fs');
const path = require('path');

const wfPath = path.join(__dirname, '..', 'workflows', '05_Late_Scheduling_v17.json');
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));

// Fix 1: Update Prepare Late Data early returns to include _preflight_ok: false
const prepareNode = wf.nodes.find(n => n.name === 'Prepare Late Data');
if (prepareNode) {
  let code = prepareNode.parameters.jsCode;

  // Add _preflight_ok: false to all early returns with _preflight_failed: true
  // Pattern: _preflight_failed: true,
  // Add after: _preflight_ok: false,

  code = code.replace(
    /_preflight_failed: true,\n/g,
    '_preflight_failed: true,\n _preflight_ok: false,\n'
  );

  prepareNode.parameters.jsCode = code;
  console.log('✓ Fixed Prepare Late Data: Added _preflight_ok: false to early returns');
}

// Fix 2: Update Check Pre-flight Result to respect _preflight_failed
const checkNode = wf.nodes.find(n => n.name === 'Check Pre-flight Result');
if (checkNode) {
  let code = checkNode.parameters.jsCode;

  // Add check at the start: if prev._preflight_failed, skip HTTP check logic
  const oldStart = `const response = $json;
const prev = $('Prepare Late Data').item.json;

const statusCode = response.statusCode || response.status || 0;`;

  const newStart = `const response = $json;
const prev = $('Prepare Late Data').item.json;

// If Prepare Late Data already marked as preflight failed, don't override
if (prev._preflight_failed) {
  console.log(\`[W3] ⚠ Pre-flight skipped for \${prev.content_id}: \${prev._preflight_error || 'validation failed'}\`);
  return { json: { ...prev, _preflight_ok: false, _preflight_error: prev._preflight_error || 'Validation failed', _preflight_error_code: prev._preflight_error_code || 'VALIDATION_FAILED' } };
}

const statusCode = response.statusCode || response.status || 0;`;

  if (code.includes(oldStart)) {
    code = code.replace(oldStart, newStart);
    checkNode.parameters.jsCode = code;
    console.log('✓ Fixed Check Pre-flight Result: Now respects _preflight_failed flag');
  } else {
    console.log('⚠ Could not find expected pattern in Check Pre-flight Result');
    // Try alternative fix - just add the check
    const altOld = `const response = $json;
const prev = $('Prepare Late Data').item.json;`;
    const altNew = `const response = $json;
const prev = $('Prepare Late Data').item.json;

// If Prepare Late Data already marked as preflight failed, don't override
if (prev._preflight_failed) {
  console.log(\`[W3] ⚠ Pre-flight skipped for \${prev.content_id}: \${prev._preflight_error || 'validation failed'}\`);
  return { json: { ...prev, _preflight_ok: false, _preflight_error: prev._preflight_error || 'Validation failed', _preflight_error_code: prev._preflight_error_code || 'VALIDATION_FAILED' } };
}`;
    if (code.includes(altOld)) {
      code = code.replace(altOld, altNew);
      checkNode.parameters.jsCode = code;
      console.log('✓ Fixed Check Pre-flight Result (alt): Now respects _preflight_failed flag');
    }
  }
}

// Verify syntax for both nodes
for (const node of [prepareNode, checkNode]) {
  if (node) {
    try {
      new Function(node.parameters.jsCode);
      console.log(`✓ ${node.name}: Syntax valid`);
    } catch (e) {
      console.error(`✗ ${node.name}: Syntax error - ${e.message}`);
      process.exit(1);
    }
  }
}

// Save
fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2));
console.log('\n✓ Workflow saved to', wfPath);
console.log('\nRe-import 05_Late_Scheduling_v17.json in n8n to apply changes.');
