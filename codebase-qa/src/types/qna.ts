export interface Snippet {
  file: string;
  code: string;
  startLine: number;
  endLine: number;
  highlight: [number, number];
}

export interface Reference {
  file: string;
  lines: [number, number];
  explanation: string;
}

export interface QnA {
  id?: string;
  question: string;
  answer: string;
  references: Reference[];
  snippets: Snippet[];
}
