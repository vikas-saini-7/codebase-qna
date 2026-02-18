import type { Reference } from "@/types/qna";
import { Link as LucideLink } from "lucide-react";

export interface AnswerCardProps {
  answer: string;
  references: Reference[];
  onReferenceClick?: (ref: Reference) => void;
  leftAlignReferences?: boolean;
}

export function AnswerCard({
  answer,
  references,
  onReferenceClick,
  leftAlignReferences = false,
}: AnswerCardProps) {
  const safeReferences = Array.isArray(references) ? references : [];
  return (
    <div className="rounded-lg p-3 space-y-3">
      {/* Answer Section (conditionally rendered) */}
      {typeof answer === "string" && answer.trim() !== "" && (
        <div>
          <div className="text-sm font-semibold text-neutral-100 mb-1">
            Answer
          </div>
          <div className="text-sm text-neutral-100 bg-[#23262f] rounded p-2 border border-[#23262f]">
            {answer}
          </div>
        </div>
      )}
      {/* Reference Section */}
      <div className="space-y-1">
        <div className="text-xs font-semibold text-neutral-400 mb-0.5 uppercase flex items-center gap-1">
          <LucideLink
            size={14}
            strokeWidth={1.5}
            className="inline-block text-neutral-400"
          />
          References
        </div>
        <ul
          className={
            leftAlignReferences ? "space-y-0.5 text-left" : "space-y-0.5"
          }
        >
          {safeReferences.length === 0 ? (
            <li className="text-xs text-neutral-500 italic">
              No references found.
            </li>
          ) : (
            safeReferences.map((ref, i) => (
              <li
                key={i}
                className="flex items-center gap-1 px-1 py-0.5 rounded hover:bg-[#23262f] transition-colors"
              >
                <button
                  type="button"
                  className="text-blue-500 hover:underline text-xs font-mono text-left bg-transparent p-0"
                  onClick={() => onReferenceClick?.(ref)}
                  style={{ minWidth: 0 }}
                >
                  {ref.file}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
