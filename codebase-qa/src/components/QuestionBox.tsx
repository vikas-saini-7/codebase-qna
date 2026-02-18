import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface QuestionBoxProps {
  onAsk: (question: string) => void;
  loading?: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function QuestionBox({
  onAsk,
  loading,
  value,
  onChange,
}: QuestionBoxProps) {
  const [error, setError] = React.useState<string | null>(null);

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      setError("Please enter a question.");
      return;
    }
    setError(null);
    onAsk(value);
  };

  return (
    <form onSubmit={handleAsk} className="space-y-2">
      <Input
        type="text"
        placeholder="Ask a question about your codebase..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
