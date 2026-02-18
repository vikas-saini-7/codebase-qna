import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { type QnA } from "@/types/qna";

// DELETE /api/qna-history { id }
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const { error } = await supabase.from("qna_history").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    const err = e instanceof Error ? e : { message: String(e) };
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 },
    );
  }
}

// POST /api/qna-history { repositoryId }
export async function POST(req: NextRequest) {
  try {
    const { repositoryId } = await req.json();
    if (!repositoryId) {
      return NextResponse.json(
        { error: "Missing repositoryId" },
        { status: 400 },
      );
    }

    // Fetch last 10 QnA for this repo, most recent first
    const { data, error } = await supabase
      .from("qna_history")
      .select("id, question, answer, references, snippets")
      .eq("repository_id", repositoryId)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // Parse references/snippets if needed
    const history: QnA[] = (data || []).map((row: unknown) => {
      if (
        typeof row === "object" &&
        row !== null &&
        "id" in row &&
        "question" in row &&
        "answer" in row &&
        "references" in row &&
        "snippets" in row
      ) {
        const r = row as {
          id: string;
          question: string;
          answer: string;
          references: unknown;
          snippets: unknown;
        };
        let references: unknown = r.references;
        let snippets: unknown = r.snippets;
        try {
          if (typeof references === "string")
            references = JSON.parse(references);
        } catch {}
        try {
          if (typeof snippets === "string") snippets = JSON.parse(snippets);
        } catch {}
        return {
          id: r.id,
          question: r.question,
          answer: r.answer,
          references: Array.isArray(references)
            ? (references as import("@/types/qna").Reference[])
            : [],
          snippets: Array.isArray(snippets)
            ? (snippets as import("@/types/qna").Snippet[])
            : [],
        };
      }
      // fallback empty
      return {
        id: "",
        question: "",
        answer: "",
        references: [],
        snippets: [],
      };
    });
    return NextResponse.json({ history });
  } catch (e) {
    const err = e instanceof Error ? e : { message: String(e) };
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 },
    );
  }
}
