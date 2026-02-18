// lib/qna.ts
// Q&A history logic: save, cleanup, fetch
import { supabase } from "./supabase";

export type QnARecord = {
  id: string;
  repository_id: string;
  question: string;
  answer: string;
  created_at: string;
};

export async function saveQnA({
  repositoryId,
  question,
  answer,
  references,
  snippets,
}: {
  repositoryId: string;
  question: string;
  answer: string;
  references: any;
  snippets: any;
}): Promise<void> {
  // Insert new QnA with references and snippets columns
  const { error } = await supabase.from("qna_history").insert({
    repository_id: repositoryId,
    question,
    answer,
    references: JSON.stringify(references),
    snippets: JSON.stringify(snippets),
  });
  if (error) throw new Error("Failed to save QnA: " + error.message);
  // Cleanup: keep only last 10 per repo
  await supabase.rpc("cleanup_qna_history", { repo_id: repositoryId });
}

export async function getQnAHistory(
  repositoryId: string,
): Promise<QnARecord[]> {
  const { data, error } = await supabase
    .from("qna_history")
    .select("*")
    .eq("repository_id", repositoryId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw new Error("Failed to fetch QnA history: " + error.message);
  return data || [];
}
