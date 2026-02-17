"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

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

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZipFile(e.target.files?.[0] || null);
    setError(null);
  };

  const handleRepoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRepoUrl(e.target.value);
    setError(null);
  };

  const handleIndex = (e: React.FormEvent) => {
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
    setTimeout(() => {
      setLoading(false);
      onIndexEnd?.();
    }, 1800); // Simulate loading
  };

  return (
    <div className="w-full max-w-md mx-auto bg-card border border-border rounded-lg p-8 shadow-lg">
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
  );
}
