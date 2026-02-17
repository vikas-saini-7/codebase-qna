"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type StatusResult = {
  database: { status: "healthy" | "unhealthy"; error: string | null };
  vector: { status: "healthy" | "unhealthy"; error: string | null };
  llm: { status: "healthy" | "unhealthy"; error: string | null };
  overall: "healthy" | "degraded";
  timestamp: string;
};

const statusLabels = [
  { key: "database", label: "Database" },
  { key: "vector", label: "Vector Search" },
  { key: "llm", label: "LLM Connection" },
];

export default function StatusPage() {
  const [status, setStatus] = useState<StatusResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch("/api/status")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch status");
        return res.json();
      })
      .then((data) => {
        if (!ignore) {
          setStatus(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!ignore) setError(err.message || "Unknown error");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="container max-w-xl w-full flex flex-col gap-8 py-16">
        <h1 className="text-2xl font-bold mb-2 text-primary">System Status</h1>
        {loading ? (
          <div className="flex flex-col gap-4 animate-pulse">
            {statusLabels.map((item) => (
              <Card
                key={item.key}
                className="flex items-center justify-between p-6 bg-card border border-border opacity-70"
              >
                <span className="text-lg font-medium">{item.label}</span>
                <span className="h-5 w-16 rounded bg-muted" />
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-destructive text-center text-base bg-card border border-border rounded-lg p-6">
            Error: {error}
          </div>
        ) : status ? (
          <>
            <div className="flex flex-col gap-6">
              {statusLabels.map((item) => {
                const sys = status[item.key as "database" | "vector" | "llm"];
                return (
                  <Card
                    key={item.key}
                    className="flex items-center justify-between p-6 bg-card border border-border"
                  >
                    <span className="text-lg font-medium">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          sys.status === "healthy" ? "default" : "destructive"
                        }
                      >
                        {sys.status === "healthy" ? "Healthy" : "Error"}
                      </Badge>
                      {sys.error && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {sys.error}
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
            <div className="mt-6 text-xs text-muted-foreground text-right">
              Last checked: {new Date(status.timestamp).toLocaleString()}
            </div>
            {status.overall === "degraded" && (
              <div className="mt-4 text-sm text-yellow-400 text-center font-medium">
                Some systems are experiencing issues. Please check details
                above.
              </div>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
