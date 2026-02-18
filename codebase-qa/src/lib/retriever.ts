// lib/retriever.ts
// Retrieves top K code chunks for a question embedding
import { supabase } from "./supabase";

export type RetrievedChunk = {
  id: string;
  file_path: string;
  start_line: number;
  end_line: number;
  content: string;
  similarity: number;
};

export async function retrieveTopKChunks({
  repositoryId,
  embedding,
  matchCount = 5,
}: {
  repositoryId: string;
  embedding: number[];
  matchCount?: number;
}): Promise<RetrievedChunk[]> {
  // Call pgvector RPC
  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: embedding,
    match_count: matchCount,
    repo_id: repositoryId,
  });
  if (error) throw new Error("Vector search failed: " + error.message);
  if (!data || data.length === 0) return [];
  return data;
}
