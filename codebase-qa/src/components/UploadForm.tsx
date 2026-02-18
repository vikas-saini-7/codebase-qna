"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UploadFormProps {
  onIndexStart?: () => void;
  onIndexEnd?: () => void;
}

export function UploadForm({ onIndexStart, onIndexEnd }: UploadFormProps) {
  const [tab, setTab] = useState("zip");
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [repoId, setRepoId] = useState<string | null>(null);
  const [repoName, setRepoName] = useState<string | null>(null);
  const [indexedRepos, setIndexedRepos] = useState<
    { id: string; name: string }[]
  >([]);
  // Load indexed repos from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("indexedRepos");
      if (stored) {
        setIndexedRepos(JSON.parse(stored));
      }
    }
  }, []);

  // Helper to add a repo to localStorage and state
  function addIndexedRepo(id: string, name: string) {
    const newRepos = [
      { id, name },
      ...indexedRepos.filter((r) => r.id !== id), // prevent duplicates
    ];
    setIndexedRepos(newRepos);
    if (typeof window !== "undefined") {
      localStorage.setItem("indexedRepos", JSON.stringify(newRepos));
    }
  }
  const router = useRouter();

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZipFile(e.target.files?.[0] || null);
    setError(null);
  };

  const handleRepoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRepoUrl(e.target.value);
    setError(null);
  };

  const handleIndex = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (tab === "zip" && !zipFile) {
      setError("Please select a ZIP file.");
      return;
    }
    if (tab === "github" && !repoUrl.trim()) {
      setError("Please enter a GitHub repository URL.");
      return;
    }
    setLoading(true);
    onIndexStart?.();
    try {
      let response;
      if (tab === "zip") {
        const formData = new FormData();
        formData.append("file", zipFile!);
        response = await fetch("/api/index", {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch("/api/index", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ githubUrl: repoUrl.trim() }),
        });
      }
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Indexing failed. Please try again.");
      } else {
        setZipFile(null);
        setRepoUrl("");
        setRepoId(data.repository_id || null);
        // Try to get a name for the repo: prefer backend, else fallback to file or url
        let repoName = data.repository_name;
        if (!repoName) {
          if (tab === "zip" && zipFile)
            repoName = zipFile.name.replace(/\.zip$/, "");
          else if (tab === "github" && repoUrl) repoName = repoUrl;
          else repoName = "Unnamed Repo";
        }
        setRepoName(repoName);
        if (data.repository_id && repoName) {
          addIndexedRepo(data.repository_id, repoName);
        }
        setShowSuccess(true);
      }
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof (err as { message?: unknown }).message === "string"
      ) {
        setError((err as { message: string }).message);
      } else {
        setError("Unexpected error. Please try again.");
      }
    } finally {
      setLoading(false);
      onIndexEnd?.();
    }
  };

  return (
    <>
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border border-border rounded-lg p-8 shadow-xl w-full max-w-sm text-center">
            <div className="text-2xl font-semibold mb-2">Hurray! 🎉</div>
            <div className="text-muted-foreground mb-6">
              Repo indexed for question and answers.
              <br />
              You can now go to ask questions.
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (repoId) {
                  router.push(`/ask?repo_id=${encodeURIComponent(repoId)}`);
                } else {
                  console.error("Missing repository ID after indexing.");
                }
              }}
            >
              Go to Ask Questions
            </Button>
          </div>
        </div>
      )}

      {/* Single form at the top */}
      <div className="w-full max-w-md mx-auto bg-card border border-border rounded-lg p-8 shadow-lg mb-6">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-6">
            <TabsTrigger value="zip">Upload ZIP</TabsTrigger>
            <TabsTrigger value="github">GitHub URL</TabsTrigger>
          </TabsList>
          <TabsContent value="zip">
            <form onSubmit={handleIndex} className="space-y-4">
              <label className="block text-muted-foreground text-sm font-medium mb-1">
                Select a ZIP file
              </label>
              <Input
                type="file"
                accept=".zip"
                onChange={handleZipChange}
                disabled={loading}
                className="file:bg-accent file:text-accent-foreground"
              />
              {zipFile && (
                <div className="text-xs text-muted-foreground truncate">
                  {zipFile.name}
                </div>
              )}
              {error && (
                <div className="text-destructive text-xs mt-1">{error}</div>
              )}
              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Upload className="animate-spin w-4 h-4" />
                    Indexing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" />
                    Index Repository
                  </span>
                )}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="github">
            <form onSubmit={handleIndex} className="space-y-4">
              <label className="block text-muted-foreground text-sm font-medium mb-1">
                Enter a public GitHub repository URL
              </label>
              <Input
                type="url"
                placeholder="https://github.com/owner/repo"
                value={repoUrl}
                onChange={handleRepoChange}
                disabled={loading}
                autoFocus
              />
              {error && (
                <div className="text-destructive text-xs mt-1">{error}</div>
              )}
              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Upload className="animate-spin w-4 h-4" />
                    Indexing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" />
                    Index Repository
                  </span>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>

      {/* Improved card-style list of indexed repos */}
      {indexedRepos.length > 0 && (
        <div className="w-full max-w-md mx-auto mb-6 bg-card border border-border rounded-lg p-4 shadow">
          <div className="font-semibold mb-3 text-primary text-base">
            Your Indexed Repositories
          </div>
          <ul className="space-y-2">
            {indexedRepos.map((repo) => (
              <li
                key={repo.id}
                className="flex items-center justify-between gap-2 bg-muted rounded px-3 py-2 border border-border hover:shadow-sm transition"
              >
                <span className="truncate text-sm font-medium text-foreground">
                  {repo.name}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="px-3 py-1"
                  onClick={() =>
                    router.push(`/ask?repo_id=${encodeURIComponent(repo.id)}`)
                  }
                >
                  Ask Questions
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* How it works explanation */}
      <div className="w-full max-w-md mx-auto text-xs text-muted-foreground text-center px-2 pb-2">
        <span>
          <strong>How it works:</strong> Upload a ZIP file or enter a GitHub
          repo URL, then index your repository to start asking questions about
          your codebase.
        </span>
      </div>
    </>
  );
}
