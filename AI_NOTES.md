# AI_NOTES.md

## What AI tools were used

- GitHub Copilot (GPT-4.1)
- ChatGPT (OpenAI GPT-4)

## What was checked manually

- All core features were tested manually after implementation.
- UI/UX was reviewed for clarity and usability.
- Error handling and edge cases were checked.
- Deployment was verified on Vercel.

## LLM/Provider Used

- OpenRouter API (openrouter/auto and other free models)

### Why this LLM/provider?

- OpenRouter was chosen for its free access to strong open-source and commercial LLMs, easy API integration, and no cost for development/testing.
- The app uses OpenRouter's /api/v1/chat/completions endpoint for Q&A generation.

## System Architecture

The app uses a two-phase pipeline:

1. Ingestion: Codebase is parsed, chunked, embedded (Xenova/all-MiniLM-L6-v2, 384-dim), and stored in Supabase (pgvector).
2. Q&A: User question is embedded, similar code chunks are retrieved, and OpenRouter LLM generates a structured answer with references.

See README.md for architecture diagrams.

## Notes

- No API keys or sensitive data are included in the codebase.
- All AI-generated code was reviewed and tested before submission.
