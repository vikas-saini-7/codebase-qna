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
  const [reposLoading, setReposLoading] = useState(true);
  // Load indexed repos from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setReposLoading(true);
      setTimeout(() => {
        const stored = localStorage.getItem("indexedRepos");
        if (stored) {
          setIndexedRepos(JSON.parse(stored));
        }
        setReposLoading(false);
      }, 400); // short delay for skeleton effect
    } else {
      setReposLoading(false);
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

  // Helper to delete a repo from backend and localStorage
  async function handleDeleteRepo(id: string) {
    if (
      !window.confirm(
        "Are you sure you want to delete this repository and all its data?",
      )
    )
      return;
    try {
      const res = await fetch("/api/repository", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId: id }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete repository.");
        return;
      }
      const newRepos = indexedRepos.filter((r) => r.id !== id);
      setIndexedRepos(newRepos);
      if (typeof window !== "undefined") {
        localStorage.setItem("indexedRepos", JSON.stringify(newRepos));
      }
    } catch (e) {
      setError("Failed to delete repository.");
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#232326] border border-[#333] rounded-xl p-8 shadow-xl w-full max-w-sm text-center text-[#e6eaf1]">
            <div className="text-2xl font-semibold mb-2">Hurray! 🎉</div>
            <div className="text-[#8b949e] mb-6">
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
      <div className="w-full max-w-md mx-auto bg-gray-500/10 border rounded-xl p-8 border-0 shadow-lg mb-6 text-[#e6eaf1]">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-6 bg-[#1A1A1D] border-0 rounded-lg">
            <TabsTrigger value="zip">Upload ZIP</TabsTrigger>
            <TabsTrigger value="github">GitHub URL</TabsTrigger>
          </TabsList>
          <TabsContent value="zip">
            <form onSubmit={handleIndex} className="space-y-4">
              <label className="block text-[#8b949e] text-sm font-medium mb-1">
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
                <div className="text-xs text-[#8b949e] truncate">
                  {zipFile.name}
                </div>
              )}
              {error && (
                <div className="text-red-400 text-xs mt-1">{error}</div>
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
              <label className="block text-[#8b949e] text-sm font-medium mb-1">
                Enter a public GitHub repository URL
              </label>
              <Input
                type="url"
                placeholder="https://github.com/owner/repo"
                value={repoUrl}
                onChange={handleRepoChange}
                disabled={loading}
                autoFocus
                className="bg-[#1A1A1D] border-0"
              />
              {error && (
                <div className="text-red-400 text-xs mt-1">{error}</div>
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
      {reposLoading ? (
        <div className="w-full max-w-3xl mx-auto mb-6">
          <div className="h-5 w-40 mb-3 bg-gray-500/10 rounded animate-pulse" />
          <ul className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <li
                key={i}
                className="h-9 bg-gray-500/10 rounded animate-pulse"
              />
            ))}
          </ul>
        </div>
      ) : indexedRepos.length > 0 ? (
        <div className="w-full max-w-3xl mx-auto mb-6 bg-gray-500/10 rounded-xl p-4 shadow text-[#e6eaf1]">
          <div className="font-semibold mb-3 text-[#e6eaf1] text-base">
            Your Indexed Repositories
          </div>
          <ul className="space-y-2">
            {indexedRepos.map((repo) => (
              <li
                key={repo.id}
                className="flex items-center justify-between gap-2 bg-gray-500/10 rounded-lg px-3 py-2  hover:shadow-sm transition"
              >
                <span className="truncate text-sm font-medium text-[#e6eaf1]">
                  {repo.name}
                </span>
                <div className="flex gap-2">
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
                  <Button
                    size="sm"
                    variant="destructive"
                    className="px-3 py-1"
                    onClick={() => handleDeleteRepo(repo.id)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* How it works explanation */}
      <div className="w-full max-w-md mx-auto text-xs text-[#8b949e] text-center px-2 pb-2">
        <span>
          <strong>How it works:</strong> Upload a ZIP file or enter a GitHub
          repo URL, then index your repository to start asking questions about
          your codebase.
        </span>
      </div>
    </>
  );
}
