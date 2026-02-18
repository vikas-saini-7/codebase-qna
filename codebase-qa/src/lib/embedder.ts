// embedder.ts
// Generates embeddings for text chunks using Xenova transformers.js (1536-dim)
import { pipeline } from "@xenova/transformers";

const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2"; // 384-dim
const EMBEDDING_DIM = 384;

let embedder: unknown = null;
let embeddingLogCount = 0;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", EMBEDDING_MODEL);
  }
  return embedder;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const extractor = (await getEmbedder()) as (
    text: string,
    options: { pooling: string; normalize: boolean },
  ) => Promise<unknown>;

  if (!text.trim()) {
    return Array(EMBEDDING_DIM).fill(0);
  }

  const output: unknown = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });

  if (embeddingLogCount < 5) {
    console.log("Embedding input:", text.slice(0, 100), "...");
    console.log("Raw output:", output);
    embeddingLogCount++;
  }

  let vector: number[];

  // Case 1: Tensor object
  if (
    typeof output === "object" &&
    output !== null &&
    "data" in output &&
    "dims" in output
  ) {
    vector = Array.from((output as { data: number[] }).data);
  }
  // Case 2: Float32Array
  else if (output instanceof Float32Array) {
    vector = Array.from(output);
  }
  // Case 3: Nested array [[...]]
  else if (Array.isArray(output) && Array.isArray(output[0])) {
    vector = (output as number[][])[0];
  }
  // Case 4: Flat array
  else if (Array.isArray(output)) {
    vector = output as number[];
  } else {
    console.error("Unexpected embedding output:", output);
    throw new Error("Invalid embedding: unexpected output format");
  }

  if (vector.length !== EMBEDDING_DIM) {
    throw new Error(
      `Invalid embedding: got ${vector.length} dimensions, expected ${EMBEDDING_DIM}`,
    );
  }

  return vector;
}

// Batch embedding with concurrency limit
export async function embedChunks(
  chunks: { content: string }[],
  concurrency = 5,
): Promise<number[][]> {
  const results: number[][] = [];
  let idx = 0;
  async function worker() {
    while (idx < chunks.length) {
      const i = idx++;
      try {
        results[i] = await generateEmbedding(chunks[i].content);
      } catch (e: unknown) {
        results[i] = [];
        console.error(`Embedding error for chunk ${i}:`, e);
      }
    }
  }
  await Promise.all(Array(concurrency).fill(0).map(worker));
  return results;
}
