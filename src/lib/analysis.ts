export type Idea = {
  title: string;
  summary: string;
  useCase: string;
  steps: string[];
};

export type Section = {
  heading: string;
  summary: string;
  realLife: string;
};

export type DayPlan = {
  day: number;
  focus: string;
  action: string;
};

export type BookAnalysis = {
  bookTitle: string;
  overview: string;
  sections: Section[];
  ideas: Idea[];
  plan: DayPlan[];
  coveredChunks: number;
  totalChunks: number;
};

export const CHUNK_SIZE = 12000;
// Whole-book analysis: every chunk is read. This is the safety ceiling for
// enormous files so a single upload can't run forever.
export const MAX_CHUNKS = 40;

export function chunkText(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  for (let i = 0; i < clean.length; i += CHUNK_SIZE) {
    chunks.push(clean.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
}
