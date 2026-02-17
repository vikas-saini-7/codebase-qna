import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function QuestionBox() {
  const [question, setQuestion] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setError(null);
    }, 1200);
  };

  return (
    <form onSubmit={handleAsk} className="space-y-2">
      <Input
        type="text"
        placeholder="Ask a question about your codebase..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        disabled={loading}
        className="bg-card text-foreground"
      />
      {error && <div className="text-destructive text-xs">{error}</div>}
      <Button type="submit" disabled={loading} className="w-full mt-1">
        {loading ? "Asking..." : "Ask"}
      </Button>
    </form>
  );
}
