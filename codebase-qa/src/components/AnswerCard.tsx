import { Card } from "@/components/ui/card";
import type { Reference } from "@/types/qna";

interface AnswerCardProps {
  answer: string;
  references: Reference[];
  onReferenceClick?: (ref: Reference) => void;
}

export function AnswerCard({
  answer,
  references,
  onReferenceClick,
}: AnswerCardProps) {
  return (
    <Card className="p-6 bg-[#161b22] border border-[#30363d] space-y-4">
      <div className="text-base text-[#c9d1d9] mb-2 font-medium">{answer}</div>
      <div className="space-y-2">
        <div className="text-xs text-[#8b949e] font-semibold mb-1 tracking-wide uppercase">
          References:
        </div>
        <ul className="space-y-1">
          {references.map((ref, i) => (
            <li key={i}>
              <button
                type="button"
                className="text-[#2f81f7] hover:underline text-sm font-mono"
                onClick={() => onReferenceClick?.(ref)}
              >
                {ref.file}
              </button>
              <span className="ml-2 text-xs text-[#8b949e]">
                lines {ref.lines[0]}–{ref.lines[1]}
              </span>
              <span className="ml-2 text-xs text-[#8b949e] italic">
                {ref.explanation}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
