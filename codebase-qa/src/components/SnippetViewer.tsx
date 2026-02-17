import type { Snippet } from "@/types/qna";

interface SnippetViewerProps {
  snippet: Snippet;
}

export function SnippetViewer({ snippet }: SnippetViewerProps) {
  const codeLines = snippet.code.split("\n");
  const highlightStart = snippet.highlight[0];
  const highlightEnd = snippet.highlight[1];

  return (
    <div className="w-full h-full max-h-[500px] overflow-auto">
      <div className="text-xs text-[#8b949e] mb-2 font-mono">
        {snippet.file}{" "}
        <span className="ml-2">
          (lines {snippet.startLine}–{snippet.endLine})
        </span>
      </div>
      <pre className="bg-[#161b22] rounded-md p-3 text-sm font-mono overflow-x-auto text-[#c9d1d9]">
        {codeLines.map((line, idx) => {
          const lineNumber = snippet.startLine + idx;
          const isHighlighted =
            lineNumber >= highlightStart && lineNumber <= highlightEnd;
          return (
            <div
              key={idx}
              className={
                "flex items-start gap-3" +
                (isHighlighted ? " bg-[#22262e]" : "")
              }
            >
              <span className="select-none text-[#8b949e] w-8 text-right pr-2">
                {lineNumber}
              </span>
              <span className="whitespace-pre">{line}</span>
            </div>
          );
        })}
      </pre>
    </div>
  );
}
