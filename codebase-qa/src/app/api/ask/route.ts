import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/embedder";
import { retrieveTopKChunks } from "@/lib/retriever";
import { buildPrompt } from "@/lib/promptBuilder";
import { generateAnswer } from "@/lib/llm";
import { saveQnA } from "@/lib/qna";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repositoryId, question } = body;
    console.log("[ASK] repositoryId:", repositoryId, "question:", question);
    // Step 1: Validate input
    if (!repositoryId || typeof repositoryId !== "string") {
      console.warn("[ASK] Missing or invalid repositoryId", repositoryId);
      return NextResponse.json(
        { error: "Missing or invalid repositoryId" },
        { status: 400 },
      );
    }
    if (
      !question ||
      typeof question !== "string" ||
      question.trim().length < 3
    ) {
      console.warn("[ASK] Question too short or missing", question);
      return NextResponse.json(
        { error: "Question too short or missing" },
        { status: 400 },
      );
    }
    // Step 2: Embed question
    let questionEmbedding: number[];
    try {
      questionEmbedding = await generateEmbedding(question);
      console.log(
        "[ASK] Question embedding:",
        questionEmbedding.slice(0, 5),
        "... len:",
        questionEmbedding.length,
      );
    } catch (e) {
      console.error("[ASK] Embedding failed", e);
      return NextResponse.json({ error: "Embedding failed" }, { status: 500 });
    }
    // Step 3: Retrieve top K chunks
    let chunks;
    try {
      chunks = await retrieveTopKChunks({
        repositoryId,
        embedding: questionEmbedding,
        matchCount: 5,
      });
      console.log("[ASK] Retrieved chunks:", chunks.length);
    } catch (e) {
      console.error("[ASK] Vector retrieval failed", e);
      return NextResponse.json(
        { error: "Vector retrieval failed" },
        { status: 500 },
      );
    }
    if (!chunks || chunks.length === 0) {
      console.warn("[ASK] No relevant code found for repo", repositoryId);
      return NextResponse.json(
        { error: "No relevant code found", retrieved_chunks: [] },
        { status: 404 },
      );
    }
    // Step 4: Build prompt
    const prompt = buildPrompt({ question, chunks });
    // Step 5: Call LLM
    let rawResponse = "";
    try {
      rawResponse = await generateAnswer(prompt);
      console.log("[ASK] LLM raw response:", rawResponse.slice(0, 100));
    } catch (e) {
      console.error("[ASK] LLM timeout or error", e);
      return NextResponse.json(
        { error: "LLM timeout or error" },
        { status: 502 },
      );
    }
    // Step 6: Parse LLM output with fallback
    let parsed;
    function tryParseJSON(text: string) {
      try {
        const obj = JSON.parse(text);
        if (obj && typeof obj.answer === "string" && "references" in obj) {
          return obj;
        }
      } catch {}
      return null;
    }
    parsed = tryParseJSON(rawResponse);
    if (!parsed) {
      // Try to extract JSON substring
      const match = rawResponse.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = tryParseJSON(match[0]);
      }
    }
    if (!parsed) {
      // Retry with stricter prompt if possible
      const strictPrompt =
        buildPrompt({ question, chunks }) +
        "\n\nCRITICAL: Respond ONLY with valid JSON. Do NOT add any text, explanation, or markdown. Output ONLY the JSON object.";
      try {
        const retryRaw = await generateAnswer(strictPrompt);
        parsed = tryParseJSON(retryRaw);
        if (!parsed) {
          const match = retryRaw.match(/\{[\s\S]*\}/);
          if (match) parsed = tryParseJSON(match[0]);
        }
      } catch {}
    }
    if (!parsed) {
      console.warn("[ASK] Model returned invalid format after fallback");
      parsed = { answer: "Model returned invalid format.", references: [] };
    }
    // Step 7: Save Q&A (ignore errors)
    try {
      await saveQnA({
        repositoryId,
        question,
        answer: parsed.answer,
        references: parsed.references,
        snippets: chunks.map(
          ({ file_path, start_line, end_line, content }) => ({
            file: file_path,
            startLine: start_line,
            endLine: end_line,
            code: content,
            highlight: [start_line, end_line],
          }),
        ),
      });
    } catch (e) {
      console.warn("[ASK] Failed to save QnA", e);
    }
    // Step 8: Return response
    return NextResponse.json({
      answer: parsed.answer,
      references: parsed.references,
      retrieved_chunks: chunks.map(
        ({ file_path, start_line, end_line, content }) => ({
          file: file_path,
          start_line,
          end_line,
          content,
        }),
      ),
    });
  } catch (e) {
    console.error("[ASK] Unexpected error", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
