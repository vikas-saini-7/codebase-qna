// lib/promptBuilder.ts
// Builds prompt for LLM using retrieved code chunks
import { RetrievedChunk } from "./retriever";

export function buildPrompt({
  question,
  chunks,
}: {
  question: string;
  chunks: RetrievedChunk[];
}): string {
  let prompt = `You are analyzing a codebase.\n\nAnswer ONLY using the provided code snippets.\n\nReturn STRICT JSON in this format:\n\n{ "answer": "Clear explanation", "references": [ { "file": "path/to/file", "start_line": number, "end_line": number, "reason": "Why this snippet supports the answer" } ] }\n\nIf the answer cannot be found: { "answer": "Not found in provided snippets", "references": [] }\n\n## SNIPPETS:`;
  for (const chunk of chunks) {
    prompt += `\n\nFile: ${chunk.file_path} (${chunk.start_line}-${chunk.end_line})\n${chunk.content}\n---`;
  }
  prompt += `\n\nQUESTION: ${question}`;
  prompt += `\n\nIMPORTANT: Respond ONLY with valid JSON in the format specified above. Do not add any explanation or text outside the JSON.`;
  return prompt;
}
