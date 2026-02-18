// lib/llm.ts
// Calls OpenRouter LLM API for answer generation
import { env } from "process";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const OPENROUTER_MODEL = "openrouter/auto"; // or any good free model

export async function generateAnswer(
  prompt: string,
  timeoutMs = 30_000,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: "system", content: "You are a codebase Q&A assistant." },
          { role: "user", content: prompt },
        ],
        max_tokens: 1024,
        temperature: 0.2,
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error("LLM API error: " + res.statusText);
    const data = await res.json();
    // Try to extract the answer from the response
    const text = data.choices?.[0]?.message?.content || "";
    return text;
  } finally {
    clearTimeout(timeout);
  }
}
