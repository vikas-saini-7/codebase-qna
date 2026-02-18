import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const [database, vector, llm] = await Promise.all([
    checkDatabase(),
    checkVector(),
    checkLLM(),
  ]);

  const overall =
    database.status === "unhealthy" ||
    vector.status === "unhealthy" ||
    llm.status === "unhealthy"
      ? "degraded"
      : "healthy";

  const result = {
    database,
    vector,
    llm,
    overall,
    timestamp: new Date().toISOString(),
  };

  const httpStatus = overall === "healthy" ? 200 : 500;
  return NextResponse.json(result, { status: httpStatus });
}

// Functions
function getErrorMessage(err: unknown, fallback: string): string {
  if (
    typeof err === "object" &&
    err &&
    "message" in err &&
    typeof (err as { message?: unknown }).message === "string"
  ) {
    return (err as { message: string }).message;
  }
  return fallback;
}

async function checkDatabase() {
  try {
    const { error } = await supabase.from("repositories").select("id").limit(1);
    if (error) throw error;
    return { status: "healthy", error: null } as const;
  } catch (err) {
    console.error("[Status API] Database check error:", err);
    return {
      status: "unhealthy",
      error: getErrorMessage(err, "Database connection failed"),
    } as const;
  }
}

async function checkVector() {
  try {
    const testVector = new Array(384).fill(0);
    const { error } = await supabase.rpc("match_chunks", {
      query_embedding: testVector,
      match_count: 1,
      repo_id: "00000000-0000-0000-0000-000000000000",
    });
    if (error) throw error;
    return { status: "healthy", error: null } as const;
  } catch (err) {
    console.error("[Status API] Vector check error:", err);
    return {
      status: "unhealthy",
      error: getErrorMessage(err, "Vector similarity function failed"),
    } as const;
  }
}

async function checkLLM() {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "LLM API error");
    }
    return { status: "healthy", error: null } as const;
  } catch (err) {
    console.error("[Status API] LLM check error:", err);
    return {
      status: "unhealthy",
      error: getErrorMessage(err, "LLM connection failed"),
    } as const;
  }
}
