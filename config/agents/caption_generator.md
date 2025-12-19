# Caption Generator - Optimized Prompts

Multimodal prompts using USER/ASSISTANT pattern for local VLMs (llava, qwen).

## Key Principle: Image as Inspiration

The image provides **context and inspiration** - the caption should NOT literally describe it.

❌ Bad: "A golden croissant sits on a white plate next to a coffee cup"
✅ Good: "Morning bliss in every bite. The flaky layers, the buttery aroma. Start your day right."

## Design Principles Applied
- **Clear role**: "You are a social media copywriter for {brand}"
- **Image as inspiration**: "The image inspires the context. Do NOT literally describe it."
- **Explicit constraints**: 2-3 lines, 10-word hook, no hashtags
- **Platform-specific**: Instagram (hook first) vs TikTok (punchy)
- **Few-shot example**: One inline brand-style example
- **Low temperature**: 0.4-0.5 for consistency

## Language Files
- `caption_generator_fr.md` - French prompts
- `caption_generator_en.md` - English prompts

## Prompt Structure
```
USER: <image>
You are a social media copywriter for {brand}. Tone: {voice}.

Write an Instagram caption in 2-3 lines max:
- Catchy hook (10 words max)
- Evoke the experience, emotion, atmosphere
- Call to action

The image inspires the context. Do NOT literally describe the image.
No hashtags. No prices.

Example: "Fresh out of the oven..."

A:
```
