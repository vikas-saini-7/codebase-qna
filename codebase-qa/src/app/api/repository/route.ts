import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function DELETE(req: NextRequest) {
  try {
    const { repositoryId } = await req.json();
    if (!repositoryId || typeof repositoryId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid repositoryId" },
        { status: 400 },
      );
    }
    // Delete repository and cascade to chunks/qna_history
    const { error } = await supabase
      .from("repositories")
      .delete()
      .eq("id", repositoryId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
