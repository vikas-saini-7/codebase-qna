"use client";
import { useState } from "react";
import type { QnA } from "@/types/qna";
interface QnAHistoryProps {
  history: QnA[];
  onSelect: (idx: number) => void;
}

export function QnAHistory({ history, onSelect }: QnAHistoryProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
      <button
        className="text-[#2f81f7] text-sm font-semibold mb-2 hover:underline"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Hide" : "Show"} Q&A History
      </button>
      {open && (
        <ul className="space-y-2 mt-2 max-h-48 overflow-auto">
          {history.slice(0, 10).map((item, i) => (
            <li key={i}>
              <button
                className="text-[#c9d1d9] text-xs hover:underline"
                onClick={() => onSelect(i)}
              >
                {item.question}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
