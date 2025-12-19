# W2 Instruction Cascade Enhancement

This document describes the instruction cascade system in W2_AI_Captions workflow.

## Overview

The instruction cascade allows AI prompts to be customized at multiple levels:

### Phase 2.7: Language-Specific Prompts (v15)
The system now loads language-specific prompt files based on client language:
- `_config/agents/caption_generator_fr.md` - French clients
- `_config/agents/caption_generator_en.md` - English clients
- `_config/agents/caption_generator.md` - Fallback (French)

### Phase 3: Instruction Override Cascade
Overrides can be added at three levels:
1. **System Level** - Base prompt from language-specific .md file
2. **Client Level** - Override in `agent_instructions` table (scope='client')
3. **Batch Level** - Override in `agent_instructions` table (scope='batch')

Higher specificity overrides lower. Batch > Client > System.

## Current Implementation (v15)

### 1. Language-Specific Prompt Loading in "Load Config (YAML)" Node

```javascript
// Load language-specific system prompt (Phase 2.7)
const clientLang = clientConfig.language || 'fr';
const langSuffix = clientLang === 'en' ? '_en' : '_fr';
let systemPrompt = '';
try {
  const langPromptPath = `${AGENTS_PATH}/caption_generator${langSuffix}.md`;
  const defaultPromptPath = `${AGENTS_PATH}/caption_generator.md`;

  if (fs.existsSync(langPromptPath)) {
    systemPrompt = fs.readFileSync(langPromptPath, 'utf8');
    console.log(`[W2] ✓ Language-specific prompt loaded: ${langSuffix}`);
  } else if (fs.existsSync(defaultPromptPath)) {
    systemPrompt = fs.readFileSync(defaultPromptPath, 'utf8');
    console.log(`[W2] ✓ Default system prompt loaded`);
  }
} catch (e) {
  console.log(`[W2] ⚠ Could not load system prompt: ${e.message}`);
}

// Load client and batch instruction overrides from database
let clientOverride = '';
let batchOverride = '';

try {
  const db = new Database(DB_PATH, { readonly: true });

  // Get client ID
  const client = db.prepare('SELECT id FROM clients WHERE slug = ?').get(CLIENT);
  if (client) {
    const clientInstr = db.prepare(`
      SELECT instruction_value FROM agent_instructions
      WHERE agent_type = 'caption_generator'
      AND scope = 'client'
      AND scope_id = ?
      AND instruction_key = 'override'
      AND is_active = 1
    `).get(client.id);

    if (clientInstr) {
      clientOverride = clientInstr.instruction_value;
      console.log(`[W2] ✓ Client override loaded (${clientOverride.length} chars)`);
    }

    // Get batch ID
    const batch = db.prepare('SELECT id FROM batches WHERE client_id = ? AND slug = ?').get(client.id, BATCH);
    if (batch) {
      const batchInstr = db.prepare(`
        SELECT instruction_value FROM agent_instructions
        WHERE agent_type = 'caption_generator'
        AND scope = 'batch'
        AND scope_id = ?
        AND instruction_key = 'override'
        AND is_active = 1
      `).get(batch.id);

      if (batchInstr) {
        batchOverride = batchInstr.instruction_value;
        console.log(`[W2] ✓ Batch override loaded (${batchOverride.length} chars)`);
      }
    }
  }

  db.close();
} catch (e) {
  console.log(`[W2] ⚠ Could not load instruction overrides: ${e.message}`);
}

// Build merged instruction context
const instructionContext = [
  systemPrompt,
  clientOverride ? `\n--- CLIENT-SPECIFIC INSTRUCTIONS ---\n${clientOverride}` : '',
  batchOverride ? `\n--- BATCH-SPECIFIC INSTRUCTIONS ---\n${batchOverride}` : ''
].filter(Boolean).join('\n');

// ... include instructionContext in prompt building ...
```

### 2. Update Prompt Context Building

Modify the prompt context to include the merged instructions:

```javascript
const promptContext = `${instructionContext}

═══════════════════════════════════════════════════════════════════════════════
MARQUE: ${clientConfig.name || CLIENT}
═══════════════════════════════════════════════════════════════════════════════

IDENTITÉ:
- Voix: ${brand.voice || 'Professionnelle et engageante'}
- Audience cible: ${brand.target_audience || 'Grand public'}
- Description: ${brand.description || ''}

═══════════════════════════════════════════════════════════════════════════════
PROJET: ${batchConfig.name || BATCH}
═══════════════════════════════════════════════════════════════════════════════

${brief}

`;
```

### 3. Update Model Selection

Use per-agent model from settings if available:

```javascript
const OLLAMA_MODEL = settings.ollama?.models?.caption_generator || settings.ollama?.model || 'llava:7b';
```

## Implementation Notes

- The cascade system is additive: each level's instructions are appended, not replaced
- This allows system instructions to provide base rules while client/batch can add specifics
- Empty overrides are ignored (no additional context added)
- Database queries use readonly mode for safety

## Testing

After modification:
1. Set language-specific prompts in `_config/agents/caption_generator_{lang}.md`
2. Create clients with different languages (fr, en)
3. Add client override via UI (Client Detail → AI Instructions tab)
4. Add batch override via batch settings
5. Run W2 and verify:
   - Correct language prompt file is loaded
   - All instruction levels appear in prompts
   - Generated captions are in the correct language

## Rollback

If issues occur, the workflow will still function without the cascade:
- Missing language-specific file = fallback to default caption_generator.md
- Missing agent_instructions table = no overrides loaded
- Database errors are caught and logged, not fatal

## Adding a New Language

1. Create `_config/agents/caption_generator_{lang}.md` with all instructions in that language
2. Add condition in W2 "Load Config (YAML)" node:
   ```javascript
   const langSuffix = clientLang === 'en' ? '_en' : clientLang === 'de' ? '_de' : '_fr';
   ```
3. Add native prompt in W2 "Prepare Request" node
4. Test with a client using the new language
