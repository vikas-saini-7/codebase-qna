"use client";

// Helper to normalize references with possible snake_case or camelCase keys
function normalizeReferences(refs: unknown): Reference[] {
  if (!Array.isArray(refs)) return [];
  return refs.map((ref) => {
    if (
      typeof ref === "object" &&
      ref !== null &&
      ("start_line" in ref || "startLine" in ref)
    ) {
      const r = ref as {
        file: string;
        start_line?: number;
        end_line?: number;
        startLine?: number;
        endLine?: number;
        reason?: string;
        explanation?: string;
      };
      return {
        file: r.file,
        lines: [r.start_line ?? r.startLine ?? 0, r.end_line ?? r.endLine ?? 0],
        explanation: r.reason ?? r.explanation ?? "",
      };
    } else if (
      typeof ref === "object" &&
      ref !== null &&
      "file" in ref &&
      "lines" in ref
    ) {
      // Already normalized
      return ref as Reference;
    }
    // Fallback
    return { file: "", lines: [0, 0], explanation: "" };
  });
}

import * as React from "react";
import { useEffect } from "react";
import { QuestionBox } from "@/components/QuestionBox";
import { AnswerCard } from "@/components/AnswerCard";
import { QnAHistory } from "@/components/QnAHistory";
import { SnippetViewer } from "@/components/SnippetViewer";
import type { QnA, Snippet, Reference } from "@/types/qna";
import { useSearchParams } from "next/navigation";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const repoIdFromParams = searchParams?.get("repo_id");
  const repositoryId = repoIdFromParams;

  const [qnaList, setQnaList] = React.useState<QnA[]>([]);
  const [selectedSnippet, setSelectedSnippet] = React.useState<Snippet | null>(
    null,
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [selectedQnaIdx, setSelectedQnaIdx] = React.useState<number | null>(
    null,
  );
  const [questionInput, setQuestionInput] = React.useState("");

  // Fetch QnA history on initial load
  useEffect(() => {
    if (!repositoryId) return;
    setHistoryLoading(true);
    fetch("/api/qna-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repositoryId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.history)) {
          const normalized = data.history.map((qna: QnA) => {
            let answer = qna.answer;
            let references = qna.references;
            let snippets = qna.snippets;
            if (typeof answer === "string" && answer.startsWith("{")) {
              try {
                const parsed = JSON.parse(answer);
                if (parsed.answer) answer = parsed.answer;
                if (parsed.references) references = parsed.references;
              } catch {}
            }
            references = normalizeReferences(references);
            if (!Array.isArray(snippets)) snippets = [];
            return { ...qna, id: qna.id, answer, references, snippets };
          });
          setQnaList(normalized);
          setSelectedQnaIdx(null); // Do NOT auto-select any QnA on load
        }
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [repositoryId]);

  // Handle question submit
  const handleAsk = async (question: string) => {
    setLoading(true);
    setError(null);
    setSelectedSnippet(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId, question }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "API error");
        setLoading(false);
        return;
      }
      setError(null);
      // Removed unused variables: answer, references, snippets
      // After asking, re-fetch history so new QnA has its id from DB
      setHistoryLoading(true);
      fetch("/api/qna-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.history)) {
            const normalized = data.history.map((qna: QnA) => {
              let answer = qna.answer;
              let references = qna.references;
              let snippets = qna.snippets;
              if (typeof answer === "string" && answer.startsWith("{")) {
                try {
                  const parsed = JSON.parse(answer);
                  if (parsed.answer) answer = parsed.answer;
                  if (parsed.references) references = parsed.references;
                } catch {}
              }
              references = normalizeReferences(references);
              if (!Array.isArray(snippets)) snippets = [];
              return { ...qna, id: qna.id, answer, references, snippets };
            });
            setQnaList(normalized);
            setSelectedQnaIdx(0);
            if (normalized[0]?.snippets?.length > 0)
              setSelectedSnippet(normalized[0].snippets[0]);
            else setSelectedSnippet(null);
          }
        })
        .finally(() => setHistoryLoading(false));
    } catch {
      setError("Failed to fetch answer");
    } finally {
      setLoading(false);
    }
  };

  // Handle reference click
  const handleReferenceClick = (ref: Reference) => {
    // Find snippet for this reference in the currently selected QnA
    const qna = selectedQnaIdx !== null ? qnaList[selectedQnaIdx] : null;
    if (!qna || !Array.isArray(ref.lines) || ref.lines.length !== 2) return;
    // Defensive: fallback to first snippet if exact match not found
    const snippet =
      qna.snippets?.find(
        (s) =>
          s.file === ref.file &&
          s.startLine === ref.lines[0] &&
          s.endLine === ref.lines[1],
      ) ||
      (qna.snippets && qna.snippets[0]);
    if (snippet) setSelectedSnippet(snippet);
  };

  // Handle QnA history select
  const handleHistorySelect = (i: number) => {
    setSelectedQnaIdx(i);
    const qna = qnaList[i];
    if (qna && qna.snippets && qna.snippets.length > 0) {
      setSelectedSnippet(qna.snippets[0]);
    } else {
      setSelectedSnippet(null);
    }
  };

  // When a question is selected from history, update the input box
  const handleHistoryQuestionSelect = (question: string) => {
    setQuestionInput(question || "");
  };

  // Handle delete QnA
  const handleDeleteQnA = async (idx: number) => {
    const qna = qnaList[idx];
    if (!qna || !repositoryId) return;
    // Optimistically update UI
    setQnaList((prev) => prev.filter((_, i) => i !== idx));
    if (selectedQnaIdx === idx) {
      setSelectedQnaIdx(null);
      setSelectedSnippet(null);
    } else if (selectedQnaIdx && selectedQnaIdx > idx) {
      setSelectedQnaIdx(selectedQnaIdx - 1);
    }
    try {
      await fetch("/api/qna-history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: qna.id }),
      });
    } catch {}
  };

  return (
    <main className="min-h-screen bg-[#1A1A1D] text-[#e6eaf1] flex justify-center items-start py-14">
      <div className="container max-w-7xl flex flex-row gap-10 w-full">
        {/* Left: Question input and history */}
        <section className="flex flex-col w-95 min-w-[320px] max-w-sm gap-6">
          <div className="bg-gray-500/10 rounded-xl p-6 flex flex-col gap-4">
            <h1 className="text-xl font-bold tracking-tight mb-2 text-[#e6eaf1]">
              Ask your codebase
            </h1>
            <QuestionBox
              onAsk={handleAsk}
              loading={loading}
              value={questionInput}
              onChange={setQuestionInput}
            />
            {error && <div className="text-red-400 text-xs mb-2">{error}</div>}
          </div>
          <div className="bg-gray-500/10 rounded-xl p-4 h-fit min-h-[180px] overflow-auto">
            <h2 className="text-xs font-semibold text-[#8b949e] mb-2 tracking-widest uppercase">
              History
            </h2>
            {historyLoading ? (
              <ul className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <li
                    key={i}
                    className="h-8 bg-gray-500/10 rounded animate-pulse"
                  />
                ))}
              </ul>
            ) : (
              <QnAHistory
                history={qnaList}
                onSelect={handleHistorySelect}
                selectedIdx={selectedQnaIdx}
                onQuestionSelect={handleHistoryQuestionSelect}
                onDelete={handleDeleteQnA}
              />
            )}
          </div>
        </section>
        {/* Right: Answer, references, snippets */}
        <section className="flex-1 flex flex-col gap-6 min-w-100">
          <div className="bg-gray-500/10 rounded-xl p-8 flex flex-col gap-8">
            {loading && selectedQnaIdx === null ? (
              <div className="flex flex-col items-center justify-center h-full min-h-50">
                <div className="text-[#8b949e] text-base text-center animate-pulse">
                  Thinking...
                  <br />
                  Your answer is being generated.
                </div>
              </div>
            ) : selectedQnaIdx === null ? (
              <div className="flex flex-col items-center justify-center h-full min-h-50">
                <div className="text-[#8b949e] text-base text-center">
                  Start by asking a question about your codebase.
                  <br />
                  Your answer and supporting code will appear here.
                </div>
              </div>
            ) : (
              <>
                {/* Answer Section */}
                <div>
                  <h2 className="text-lg font-semibold text-[#e6eaf1] mb-2">
                    Answer
                  </h2>
                  {loading ? (
                    <div className="text-[#8b949e] text-xs mt-4">
                      Loading answer...
                    </div>
                  ) : historyLoading ? (
                    <div className="text-[#8b949e] text-xs mt-4">
                      Loading previous questions...
                    </div>
                  ) : selectedQnaIdx !== null && qnaList[selectedQnaIdx] ? (
                    <div className="bg-gray-500/10 rounded-lg p-6">
                      <div className="text-base text-[#e6eaf1] whitespace-pre-line">
                        {qnaList[selectedQnaIdx].answer}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[#8b949e] text-xs mt-4">
                      No questions asked yet. Start by asking a question about
                      your codebase.
                    </div>
                  )}
                </div>
                {/* References Section */}
                <div>
                  <h3 className="text-xs font-semibold text-[#8b949e] mb-2 tracking-widest uppercase">
                    References
                  </h3>
                  {selectedQnaIdx !== null &&
                  qnaList[selectedQnaIdx]?.references?.length ? (
                    <div className="bg-gray-500/10 rounded-lg p-4">
                      <AnswerCard
                        answer={undefined as unknown as string}
                        references={qnaList[selectedQnaIdx].references}
                        onReferenceClick={handleReferenceClick}
                        leftAlignReferences
                      />
                    </div>
                  ) : (
                    <div className="text-[#8b949e] text-xs">
                      No references found.
                    </div>
                  )}
                </div>
                {/* Snippets Section */}
                <div>
                  <h3 className="text-xs font-semibold text-[#8b949e] mb-2 tracking-widest uppercase">
                    Supporting Proof (Snippets)
                  </h3>
                  <div className="bg-gray-500/10 rounded-lg p-4">
                    {selectedSnippet ? (
                      <SnippetViewer snippet={selectedSnippet} />
                    ) : (
                      <div className="text-[#8b949e] text-xs text-center my-auto">
                        No code snippet selected.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
