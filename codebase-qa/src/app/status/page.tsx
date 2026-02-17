import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const mockStatus = [
  { name: "Backend", healthy: true },
  { name: "Database", healthy: false },
  { name: "LLM Connection", healthy: true },
];

export default function StatusPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="container max-w-xl w-full flex flex-col gap-8 py-16">
        <h1 className="text-2xl font-bold mb-2 text-primary">System Status</h1>
        <div className="flex flex-col gap-6">
          {mockStatus.map((item) => (
            <Card
              key={item.name}
              className="flex items-center justify-between p-6 bg-card border border-border"
            >
              <span className="text-lg font-medium">{item.name}</span>
              <Badge variant={item.healthy ? "default" : "destructive"}>
                {item.healthy ? "Healthy" : "Error"}
              </Badge>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
