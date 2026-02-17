You are a senior frontend engineer.

Build a production-ready frontend for a web app called:

"Codebase Q&A with Proof"

Tech Stack:
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Dark theme only (default)
- Minimal, clean, developer-focused design
- GitHub-like UI colors

Design Guidelines:
- Use dark theme similar to GitHub dark:
  Background: #0d1117
  Card background: #161b22
  Border: #30363d
  Primary text: #c9d1d9
  Muted text: #8b949e
  Accent: subtle blue like #2f81f7
- No gradients
- No bright flashy UI
- Very clean, spaced layout
- Professional SaaS developer tool look
- Use shadcn components (Card, Button, Input, Tabs, Badge, ScrollArea, Separator, Alert, Table, etc.)

App Requirements:

1) Home Page (Landing)
- Title: "Codebase Q&A with Proof"
- Short description explaining:
  "Upload a codebase or connect a public GitHub repo. Ask questions and get answers with file references and line numbers."
- Two main actions:
  - Upload ZIP file
  - Enter GitHub repo URL
- Clear CTA button: "Index Repository"
- Show loading state while indexing
- Show validation errors for empty input

2) Dashboard Page
Split layout:
- Left panel: Q&A section
- Right panel: Retrieved snippets viewer

Q&A Section:
- Input field for question
- Ask button
- Loading spinner while querying
- Show answer inside a Card
- Below answer, show references list:
   - File path (clickable style)
   - Line range
   - Small explanation
- Save and show last 10 Q&As (collapsible history list)

Snippet Viewer:
- Scrollable code display area
- Monospace font
- Dark code block style
- Show file path on top
- Show line numbers
- Highlight referenced lines subtly

3) Status Page
Simple page showing:
- Backend status
- Database status
- LLM connection status
Each shown inside Cards with:
- Green badge for healthy
- Red badge for error

UX Details:
- Use Tabs for switching between:
   - Upload
   - GitHub URL
- Use proper empty states
- Use skeleton loaders
- Disable buttons during loading
- Show toast notifications for success/error
- Fully responsive layout
- Use container max width ~1100px

Component Structure:
- app/page.tsx (home)
- app/dashboard/page.tsx
- app/status/page.tsx
- components/UploadForm.tsx
- components/QuestionBox.tsx
- components/AnswerCard.tsx
- components/SnippetViewer.tsx
- components/QnAHistory.tsx

Code Requirements:
- Clean separation of components
- Proper TypeScript types
- No inline messy code
- Use reusable UI components
- Keep layout minimal and structured

Do NOT include backend logic.
Only build frontend UI with placeholder mock data.

Make it look like a real developer productivity tool.
