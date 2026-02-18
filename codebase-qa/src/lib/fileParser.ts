// fileParser.ts
// Extracts and filters valid files from a directory (ZIP or GitHub extraction)
import * as fs from "fs";
import * as path from "path";

const IGNORED_DIRS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  ".out",
  ".target",
  "bin",
  "obj",
  "venv",
  ".env",
  ".idea",
  ".vscode",
  "__pycache__",
  ".mypy_cache",
  ".gradle",
];
const IGNORED_EXTS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".ico",
  ".pdf",
  ".zip",
  ".tar",
  ".gz",
  ".mp4",
  ".mp3",
  ".exe",
  ".dll",
  ".so",
];
const ALLOWED_EXTS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".java",
  ".go",
  ".rb",
  ".cpp",
  ".c",
  ".md",
  ".json",
  ".yml",
  ".waml",
  ".sql",
  ".sh",
  ".env.example",
];

function isHidden(file: string) {
  return path.basename(file).startsWith(".");
}

function isBinary(filePath: string) {
  // Simple binary check: read first 8000 bytes
  const buf = fs.readFileSync(filePath, { encoding: null });
  for (let i = 0; i < Math.min(buf.length, 8000); i++) {
    if (buf[i] === 0) return true;
  }
  return false;
}

export function getValidFiles(rootDir: string): string[] {
  const validFiles: string[] = [];
  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.includes(entry.name) || isHidden(entry.name)) continue;
        walk(fullPath);
      } else {
        const ext = path.extname(entry.name);
        if (!ALLOWED_EXTS.includes(ext)) continue;
        if (IGNORED_EXTS.includes(ext)) continue;
        if (isHidden(entry.name)) continue;
        const stats = fs.statSync(fullPath);
        if (stats.size > 1024 * 1024) continue; // >1MB
        if (isBinary(fullPath)) continue;
        validFiles.push(fullPath);
      }
    }
  }
  walk(rootDir);
  return validFiles;
}
