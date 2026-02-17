"use client";
import * as React from "react";
import { QuestionBox } from "@/components/QuestionBox";
import { AnswerCard } from "@/components/AnswerCard";
import { QnAHistory } from "@/components/QnAHistory";
import { SnippetViewer } from "@/components/SnippetViewer";
import type { QnA, Snippet } from "@/types/qna";

export default function DashboardPage() {
  // Mock Q&A data
  const [qnaList] = React.useState<QnA[]>([
    {
      question: "Where is authentication handled?",
      answer: "Authentication is handled in auth.ts (lines 10-45).",
      references: [
        {
          file: "src/lib/auth.ts",
          lines: [10, 45],
          explanation: "Main auth logic.",
        },
      ],
      snippets: [
        {
          file: "src/lib/auth.ts",
          code: `export function authenticate() {\n  // ...\n}`,
          startLine: 10,
          endLine: 45,
          highlight: [10, 45],
        },
      ],
    },
  ]);
  const [selectedSnippet, setSelectedSnippet] = React.useState<Snippet>(
    qnaList[0].snippets[0],
  );

  return (
    <main className="min-h-screen bg-background text-foreground flex justify-center items-start py-10">
      <div className="container max-w-5xl flex flex-col md:flex-row gap-8 w-full">
        {/* Q&A Section */}
        <section className="flex-1 min-w-[320px] max-w-lg space-y-6">
          <QuestionBox />
          <div className="mt-2">
            <AnswerCard
              answer={qnaList[0].answer}
              references={qnaList[0].references}
              onReferenceClick={() =>
                setSelectedSnippet(qnaList[0].snippets[0])
              }
            />
          </div>
          <div className="mt-2">
            <QnAHistory
              history={qnaList}
              onSelect={(i: number) =>
                setSelectedSnippet(qnaList[i].snippets[0])
              }
            />
          </div>
        </section>
        {/* Snippet Viewer */}
        <aside className="flex-1 min-w-[320px]">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 shadow-sm w-full h-full max-h-[520px]">
            <SnippetViewer snippet={selectedSnippet} />
          </div>
        </aside>
      </div>
    </main>
  );
}
