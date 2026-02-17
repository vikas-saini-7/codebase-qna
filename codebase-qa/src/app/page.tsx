import { UploadForm } from "@/components/UploadForm";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-10 px-4 py-16">
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary mb-2">
            Codebase Q&amp;A with Proof
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Upload a codebase or connect a public GitHub repo. Ask questions and
            get answers with file references and line numbers.
          </p>
        </div>
        <UploadForm />
        <div className="text-xs text-muted-foreground text-center max-w-md mx-auto mt-4">
          <span>
            <strong>How it works:</strong> Upload a ZIP file or enter a GitHub
            repo URL, then index your repository to start asking questions about
            your codebase.
          </span>
        </div>
      </div>
    </main>
  );
}
