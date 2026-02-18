import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import AdmZip from "adm-zip";
import { getValidFiles } from "@/lib/fileParser";
import { chunkFileContent } from "@/lib/chunker";
import { embedChunks } from "@/lib/embedder";
import { createRepository } from "@/lib/repository";
import { downloadAndExtractGitHubRepo } from "@/lib/github";
import { supabase } from "@/lib/supabase";

export const POST = async (req: Request) => {
  const contentType = req.headers.get("content-type") || "";
  let tempDir = "";
  let filesIndexed = 0;
  let chunksCreated = 0;
  let repository_id = "";
  const log: Record<string, unknown> = {};
  try {
    if (contentType.startsWith("multipart/form-data")) {
      // --- ZIP upload flow ---
      const parsed = await parseMultipartFormData(req);
      const file = (parsed as { file?: UploadFile }).file;
      const error = (parsed as { error?: string }).error;
      if (error || !file)
        return NextResponse.json(
          { error: error || "File missing" },
          { status: 400 },
        );
      // Step 1: Create repository record
      repository_id = await createRepository(file.name.replace(/\.zip$/, ""));
      // Step 2: Save ZIP to temp dir
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cbqna-"));
      const zipPath = await saveFileToTemp(file, tempDir);
      // Step 3: Extract ZIP
      const extractDir = path.join(tempDir, "extracted");
      fs.mkdirSync(extractDir);
      await extractZip(zipPath, extractDir);
      // Step 4: Filter valid files
      const validFiles = getValidFiles(extractDir);
      filesIndexed = validFiles.length;
      log.filesScanned = validFiles.length;
      // Step 5: Chunk files
      const allChunks: Chunk[] = [];
      for (const filePath of validFiles) {
        const content = fs.readFileSync(filePath, "utf8");
        const chunks = chunkFileContent(
          filePath.replace(extractDir + "/", ""),
          content,
        );
        allChunks.push(...chunks);
      }
      chunksCreated = allChunks.length;
      log.totalChunks = chunksCreated;
      // Step 6: Generate embeddings
      const t0 = Date.now();
      const embeddings = await embedChunks(allChunks, 5);
      log.embeddingTimeMs = Date.now() - t0;
      // Step 7: Store in Supabase
      const t1 = Date.now();
      await batchInsertChunks(repository_id, allChunks, embeddings);
      log.insertTimeMs = Date.now() - t1;
      // Step 8: Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
      // Step 9: Return summary
      return NextResponse.json({
        repository_id,
        files_indexed: filesIndexed,
        chunks_created: chunksCreated,
        status: "completed",
        log,
      });
    }
    if (contentType.startsWith("application/json")) {
      // --- GitHub URL flow ---
      let body: Record<string, unknown> = {};
      try {
        body = await req.json();
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON body" },
          { status: 400 },
        );
      }
      const githubUrl = body.githubUrl as string;
      if (!githubUrl || typeof githubUrl !== "string")
        return NextResponse.json(
          { error: "Missing githubUrl in request body" },
          { status: 400 },
        );
      const githubRegex = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)(\/)?$/;
      const match = githubUrl.match(githubRegex);
      if (!match)
        return NextResponse.json(
          {
            error:
              "Invalid GitHub repository URL. Must be in format: https://github.com/owner/repo",
          },
          { status: 400 },
        );
      const owner = match[1];
      const repo = match[2];
      // Step 1: Create repository record
      repository_id = await createRepository(`${owner}/${repo}`);
      // Step 2: Download and extract repo
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cbqna-"));
      await downloadAndExtractGitHubRepo(owner, repo, tempDir);
      // Step 3: Filter valid files
      const validFiles = getValidFiles(tempDir);
      filesIndexed = validFiles.length;
      log.filesScanned = validFiles.length;
      // Step 4: Chunk files
      const allChunks: Chunk[] = [];
      for (const filePath of validFiles) {
        const content = fs.readFileSync(filePath, "utf8");
        const chunks = chunkFileContent(
          filePath.replace(tempDir + "/", ""),
          content,
        );
        allChunks.push(...chunks);
      }
      chunksCreated = allChunks.length;
      log.totalChunks = chunksCreated;
      // Step 5: Generate embeddings
      const t0 = Date.now();
      const embeddings = await embedChunks(allChunks, 5);
      log.embeddingTimeMs = Date.now() - t0;
      // Step 6: Store in Supabase
      const t1 = Date.now();
      await batchInsertChunks(repository_id, allChunks, embeddings);
      log.insertTimeMs = Date.now() - t1;
      // Step 7: Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
      // Step 8: Return summary
      return NextResponse.json({
        repository_id,
        files_indexed: filesIndexed,
        chunks_created: chunksCreated,
        status: "completed",
        log,
      });
    }
    return NextResponse.json(
      {
        error:
          "Invalid request. Use multipart/form-data for ZIP or JSON for GitHub URL.",
      },
      { status: 400 },
    );
  } catch (err) {
    if (tempDir) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {}
    }
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal error" },
      { status: 500 },
    );
  }
};

// Helper: parse multipart/form-data for ZIP upload

async function parseMultipartFormData(req: Request) {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.startsWith("multipart/form-data")) {
    return { error: "Content-Type must be multipart/form-data" };
  }
  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
    return { error: "Missing file field in form-data" };
  }
  const fileName = file.name || "";
  if (!fileName.endsWith(".zip")) {
    return { error: "Uploaded file must be a .zip archive" };
  }
  if (file.size > 100 * 1024 * 1024) {
    return { error: "Uploaded ZIP exceeds 100MB limit" };
  }
  return { file };
}

type UploadFile = {
  name: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

async function saveFileToTemp(
  file: UploadFile,
  tempDir: string,
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filePath = path.join(tempDir, file.name);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

async function extractZip(zipPath: string, extractDir: string) {
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(extractDir, true);
}

type Chunk = {
  filePath: string;
  startLine: number;
  endLine: number;
  content: string;
};

async function batchInsertChunks(
  repository_id: string,
  chunks: Chunk[],
  embeddings: number[][],
) {
  const rows = chunks.map((chunk, i) => ({
    repository_id,
    file_path: chunk.filePath,
    start_line: chunk.startLine,
    end_line: chunk.endLine,
    content: chunk.content,
    embedding: embeddings[i],
  }));
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { error } = await supabase.from("chunks").insert(batch);
    if (error) throw error;
  }
}
