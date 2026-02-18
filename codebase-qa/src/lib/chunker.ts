// chunker.ts
// Splits a file's content into chunks of 300-500 lines, preserving line numbers

export interface Chunk {
  filePath: string;
  startLine: number;
  endLine: number;
  content: string;
}

export function chunkFileContent(
  filePath: string,
  content: string,
  minLines = 300,
  maxLines = 500,
): Chunk[] {
  const lines = content.split(/\r?\n/);
  const chunks: Chunk[] = [];
  let start = 0;
  while (start < lines.length) {
    let end = Math.min(start + maxLines, lines.length);
    // Ensure chunk is at least minLines, but not more than maxLines
    if (end - start < minLines && end !== lines.length) {
      end = Math.min(start + minLines, lines.length);
    }
    const chunkLines = lines.slice(start, end);
    if (chunkLines.join("").trim().length === 0) {
      start = end;
      continue; // skip empty chunks
    }
    chunks.push({
      filePath,
      startLine: start + 1,
      endLine: end,
      content: chunkLines.join("\n"),
    });
    start = end;
  }
  return chunks;
}
