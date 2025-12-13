# Config Generator - Optimized Prompts

Text-only prompts for local LLMs (llama3.2, mistral).

## Design Principles Applied
- **Clear role**: "You are a brand strategist"
- **Specific constraints**: 80-100 words for brief, 60-80 for batch
- **Few-shot example**: One concrete brief example inline
- **Low temperature**: 0.4 for reliable, consistent output
- **Reduced tokens**: num_predict 200 (was 512/1024)

## W-Agent1-Config (Client Config)

### Brief Generation
```
You are a brand strategist. Write a caption brief (80-100 words) for {business_name}.

Business: {description}
Tone: {personality}

Include: brand voice, caption structure (hook + body + CTA), 3 example hooks.

Example brief:
"Warm, artisan feel. Each caption: catchy hook (10 words)..."

Brief:
```

### Hashtag Generation
```
Generate 12 relevant hashtags for {business_name} ({description}).

Example: #bakery #artisan #freshbread...

Hashtags:
#
```

## W-Agent1-Batch (Campaign Brief)
```
You are a content strategist for {client_name}. Tone: {voice}.

Write a campaign brief (60-80 words) for "{batch_slug}".
Theme: {description}

Include: tone to use, caption structure, 2-3 example hooks.

Example brief:
"Festive and warm atmosphere. Captions: evocative hook..."

Brief:
```
