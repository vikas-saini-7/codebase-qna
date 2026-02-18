// fileParser.ts
// Robust file extraction & filtering for code ingestion

import fs from "fs";
import path from "path";

const MAX_FILE_SIZE = 500 * 1024; // 500KB
const MAX_DEPTH = 20; // prevent infinite recursion

const IGNORED_FILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",
  "poetry.lock",
  "Pipfile.lock",
  "Cargo.lock",
  "composer.lock",
  "Gemfile.lock",
]);

const IGNORED_DIRS = new Set([
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
  "__pycache__",
  ".mypy_cache",
  ".gradle",
  ".idea",
  ".vscode",
]);

const IGNORED_EXTS = new Set([
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
  ".class",
  ".jar",
  ".pyc",
  ".o",
  ".a",
]);

function isHidden(name: string) {
  return name.startsWith(".");
}

function isIgnoredDir(dirName: string) {
  return IGNORED_DIRS.has(dirName);
}

function isIgnoredFile(fileName: string) {
  return IGNORED_FILES.has(fileName);
}

function hasBinaryExtension(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  return IGNORED_EXTS.has(ext);
}

function isTooLarge(filePath: string) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size > MAX_FILE_SIZE;
  } catch {
    return true;
  }
}

/**
 * Detect if file is binary without reading full file.
 * Reads first 4KB only.
 */
function isBinary(filePath: string): boolean {
  try {
    const fd = fs.openSync(filePath, "r");
    const buffer = Buffer.alloc(4096);
    const bytesRead = fs.readSync(fd, buffer, 0, 4096, 0);
    fs.closeSync(fd);

    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) {
        return true; // Null byte found
      }
    }

    return false;
  } catch {
    return true;
  }
}

export function isValidFile(filePath: string): boolean {
  const fileName = path.basename(filePath);

  if (isHidden(fileName)) return false;
  if (isIgnoredFile(fileName)) return false;
  if (hasBinaryExtension(filePath)) return false;
  if (isTooLarge(filePath)) return false;
  if (isBinary(filePath)) return false;

  return true;
}

/**
 * Recursively walk directory safely.
 * Protects against:
 * - Symlink loops
 * - Permission errors
 * - Deep recursion
 */
export function getValidFiles(rootDir: string): string[] {
  const validFiles: string[] = [];
  const visited = new Set<string>();

  function walk(dir: string, depth: number) {
    if (depth > MAX_DEPTH) return;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // skip unreadable dirs
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Avoid infinite loops from symlinks
      try {
        const realPath = fs.realpathSync(fullPath);
        if (visited.has(realPath)) continue;
        visited.add(realPath);
      } catch {
        continue;
      }

      if (entry.isDirectory()) {
        if (isIgnoredDir(entry.name) || isHidden(entry.name)) continue;
        walk(fullPath, depth + 1);
      } else if (entry.isFile()) {
        if (isValidFile(fullPath)) {
          validFiles.push(fullPath);
        }
      }
    }
  }

  walk(rootDir, 0);

  return validFiles;
}
