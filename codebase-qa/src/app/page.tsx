import { UploadForm } from "@/components/UploadForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#1A1A1D] text-[#e6eaf1] flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center px-6 py-8">
        <div className="text-center space-y-4 rounded-xl p-8 w-full">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#e6eaf1]">
            Codebase Q&amp;A with Proof
          </h1>
          <p className="text-[#8b949e] text-base md:text-lg max-w-xl mx-auto">
            Upload a codebase or connect a public GitHub repo. Ask questions and
            get answers with file references and line numbers.
          </p>
        </div>
        <div className=" rounded-xl  w-full flex flex-col items-center">
          <UploadForm />
        </div>
      </div>
    </main>
  );
}
