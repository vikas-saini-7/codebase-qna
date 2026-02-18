"use client";
import { useState } from "react";
import { Trash } from "lucide-react";
import type { QnA } from "@/types/qna";

interface QnAHistoryProps {
  history: QnA[];
  onSelect: (idx: number) => void;
  selectedIdx?: number | null;
  onQuestionSelect?: (question: string) => void;
  onDelete?: (idx: number) => void;
}

export function QnAHistory({
  history,
  onSelect,
  selectedIdx,
  onQuestionSelect,
  onDelete,
}: QnAHistoryProps) {
  return (
    <div className="rounded-lg p-0">
      <ul>
        {history.slice(0, 10).map((item, i) => (
          <li key={i} className="flex items-center group">
            <button
              className={
                "flex-1 text-left px-4 py-2 text-sm text-[#e6eaf1] transition " +
                (selectedIdx === i
                  ? "bg-gray-500/10 font-semibold rounded-lg"
                  : "hover:bg-gra rounded-lg")
              }
              onClick={() => {
                onSelect(i);
                onQuestionSelect?.(item.question);
              }}
            >
              {item.question}
            </button>
            <button
              className="ml-2 p-1 text-neutral-400 hover:text-red-500 opacity-70 hover:opacity-100"
              title="Delete question"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(i);
              }}
            >
              <Trash size={16} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
