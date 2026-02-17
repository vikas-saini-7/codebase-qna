# Phase 1 -- Repository Indexing Pipeline

## Objective

Build a backend indexing pipeline that:

1.  Accepts either:
    - A ZIP file upload
    - A public GitHub repository URL
2.  Extracts and parses valid code files
3.  Splits files into chunks
4.  Generates embeddings for each chunk
5.  Stores chunks and embeddings in Supabase (pgvector)
6.  Links all chunks to a repository record
7.  Returns an indexing summary

---

# Tech Stack Assumptions

- Next.js (App Router)
- Supabase (Postgres + pgvector)
- Embedding dimension: 1536
- Embedding model: text-embedding-3-small (or compatible 1536-dim
  model)

---

# Folder Structure

/app/api/index/route.ts\
/lib/fileParser.ts\
/lib/chunker.ts\
/lib/embedder.ts\
/lib/github.ts\
/lib/supabase.ts

---

# API Endpoint

## POST /api/index

This endpoint must support:

1.  ZIP upload (multipart/form-data)
2.  GitHub URL (application/json)
 - handle if url is not public

---

# Step 1 -- Create Repository Record

Insert into `repositories`:

{ name: repositoryName }

Return `repository_id`.

---

# Step 2 -- Accept Input

### Case A -- ZIP Upload

- Accept multipart/form-data
- File field name: "file"
- Validate file exists
- Validate file type is zip

### Case B -- GitHub URL

{ "githubUrl": "https://github.com/owner/repo" }

Validation: - Must be valid GitHub URL - Must contain owner and repo

Return 400 if invalid.

---

# Step 3 -- Fetch Repository Files

## ZIP Upload

1.  Save file temporarily
2.  Extract using unzipper or adm-zip
3.  Extract to temp directory

## GitHub URL

1.  Parse owner and repo
2.  Download: https://api.github.com/repos/{owner}/{repo}/zipball
3.  Extract

Recursively traverse directory.

---

# Step 4 -- Filter Valid Files

Ignore directories:

node_modules\
.git\
dist\
build\
.next\
coverage
.out
.target
bin
obj
venv
.env
.idea
.vscode
__pycache__
.mypy_cache
.gradle
.png
.jpg
.jpeg
.gif
.svg
.ico
.pdf
.zip
.tar
.gz
.mp4
.mp3
.exe
.dll
.so



Allow extensions:

.ts\
.tsx\
.js\
.jsx\
.py\
.java\
.go\
.rb\
.cpp\
.c\
.md
.json
.yml
.waml
.sql
.sh
.env.example

Skip: - Files \> 1MB - Binary files - Hidden files

---

# Step 5 -- Chunk Files

Rules: - 300--500 lines per chunk - Preserve line numbers - Skip empty
chunks

Chunk format:

{ filePath: string, startLine: number, endLine: number, content: string
}

---

# Step 6 -- Generate Embeddings

Call:

generateEmbedding(chunk.content)

Requirements: - Returns number\[\] - Length = 1536 - Limit concurrency
(5--10 at a time)

---

# Step 7 -- Store in Supabase

Insert batches (50--100 rows):

{ repository_id, file_path, start_line, end_line, content, embedding }

---

# Step 8 -- Cleanup

- Delete temp directory
- Delete uploaded zip

---

# Step 9 -- Return Response

Success:

{ "repository_id": "...", "files_indexed": number, "chunks_created":
number, "status": "completed" }

Errors: - 400 → invalid input - 500 → processing error

---

# Logging Requirements

Log: - Files scanned - Valid files count - Total chunks - Embedding
time - Insert time

---

# Completion Criteria

- ZIP upload works
- GitHub URL works
- Files parsed correctly
- Chunks created
- Embeddings generated
- Stored in Supabase
- Proper summary returned
