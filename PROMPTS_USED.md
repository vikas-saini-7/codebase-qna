# PROMPTS_USED.md

This file records the main prompts used for app development. Do not include agent responses, API keys, or sensitive information.

---

## Project Structure & Phases

I divided the project into two main phases:

### [Phase 1: Ingestion Pipeline](PHASE-1.md)

- Handles repository/codebase ingestion.
- Accepts a ZIP file or GitHub repo URL, extracts and parses code files, splits them into chunks, generates embeddings, and stores them in Supabase (pgvector).
- See full details in [PHASE-1.md](PHASE-1.md).

### [Phase 2: Codebase Q&A with Proof](PHASE-2.md)

- Handles user questions about the codebase.
- Retrieves relevant code chunks using vector similarity, uses an LLM to generate structured answers with file paths, line ranges, and code snippets, and saves the last 10 Q&As.
- See full details in [PHASE-2.md](PHASE-2.md).

---

## App Flow

1. **Phase 1 (Ingestion):**
   - User uploads a codebase (ZIP or GitHub URL).
   - Backend extracts, parses, chunks, and embeds code.
   - Embeddings and metadata are stored in Supabase for fast retrieval.
2. **Phase 2 (Q&A):**
   - User asks a question about the ingested codebase.
   - The app embeds the question, retrieves similar code chunks, and sends them to an LLM.
   - The LLM returns an answer with references (file paths, line ranges, code snippets).
   - The answer and references are displayed in the UI and saved for history.

---

## Example Prompts

- "Create a Next.js API route for uploading and parsing a zip file."
- "How to extract code snippets from a file and return line numbers?"
- "Generate a status page that checks backend, database, and LLM health."
- "Show how to save and display the last 10 Q&As in a Next.js app."
- "What is the best way to link to file paths and line numbers in a code viewer?"

---

Add your actual prompts below as you use them:

-
-
-
-
