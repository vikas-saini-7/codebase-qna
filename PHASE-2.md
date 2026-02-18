# Phase 2 -- Codebase Q&A with Proof

## Objective

Build a question-answering pipeline that:

1.  Accepts a natural language question
2.  Retrieves relevant code chunks using vector similarity
3.  Uses an LLM to generate a structured answer
4.  Returns:
    - Explanation
    - File paths
    - Line ranges
    - Referenced snippets
5.  Saves last 10 Q&As per repository
6.  Displays referenced code separately in UI

---

# High-Level Architecture

User Question ↓ POST /api/ask ↓ Embed Question ↓ Vector Similarity
Search (pgvector) ↓ Retrieve Top K Chunks ↓ Build Structured Prompt ↓
LLM Call ↓ Parse Structured JSON ↓ Save Q&A ↓ Return Answer + References

---

# Folder Structure

/app/api/ask/route.ts\
/lib/retriever.ts\
/lib/promptBuilder.ts\
/lib/llm.ts\
/lib/qna.ts

---

# Database Requirements

## New Table: qna_history

```sql
create table qna_history (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid references repositories(id) on delete cascade,
  question text not null,
  answer text not null,
  created_at timestamp default now()
);
```

---

# API Endpoint

## POST /api/ask

Request Body:

```json
{
  "repositoryId": "uuid",
  "question": "Where is authentication handled?"
}
```

Validation: - repositoryId must exist - question must not be empty -
return 400 for invalid input

---

# Step 1 -- Validate Input

Reject if: - Missing repositoryId - Missing question - Question length
\< 3 characters

---

# Step 2 -- Embed Question

```ts
const questionEmbedding = await generateEmbedding(question);
```

Embedding dimension must match DB schema.

---

# Step 3 -- Retrieve Top K Chunks

Use pgvector RPC:

match_chunks(query_embedding, match_count, repo_id)

Recommended:

match_count = 5

Return: - file_path - start_line - end_line - content - similarity score

---

# Step 4 -- Build Prompt

Prompt Template:

You are analyzing a codebase.

Answer ONLY using the provided code snippets.

Return STRICT JSON in this format:

{ "answer": "Clear explanation", "references": \[ { "file":
"path/to/file", "start_line": number, "end_line": number, "reason": "Why
this snippet supports the answer" } \] }

If the answer cannot be found: { "answer": "Not found in provided
snippets", "references": \[\] }

## SNIPPETS:

File: {filePath} ({start}-{end}) {code} ---

---

# Step 5 -- Call LLM

```ts
const rawResponse = await generateAnswer(prompt);
```

Add timeout protection if possible.

---

# Step 6 -- Parse LLM Output

```ts
const parsed = JSON.parse(rawResponse);
```

If parsing fails, return fallback:

{ "answer": "Model returned invalid format.", "references": \[\] }

---

# Step 7 -- Save Q&A

Insert into qna_history.

Keep only last 10 per repository.

Example cleanup query:

```sql
delete from qna_history
where id not in (
  select id from qna_history
  where repository_id = $1
  order by created_at desc
  limit 10
)
and repository_id = $1;
```

---

# Step 8 -- Return Response

Return:

{ "answer": "...", "references": \[...\], "retrieved_chunks": \[ {
"file": "...", "start_line": ..., "end_line": ..., "content": "..." } \]
}

Frontend must: - Show answer - Show references - Show retrieved snippets
separately - Allow clicking file reference

---

# Status Page Requirements

Extend /api/status to include:

- Database health check
- Vector RPC check
- LLM health check

---

# Error Handling

Return clear errors for:

- No chunks found
- Empty question
- Invalid repository ID
- LLM timeout
- Malformed LLM response

Never expose raw stack traces.

---

# Optional Enhancements

- Refactor suggestion mode
- Question tagging
- Show similarity scores
- Search fallback if similarity is low
- Token usage display

---

# Completion Criteria

Phase 2 is complete when:

- Question embedding works
- Vector retrieval works
- LLM structured output works
- Answer includes file paths + line ranges
- Snippets shown separately
- Last 10 Q&As saved correctly
- Status page reflects LLM health
- Proper error handling implemented
