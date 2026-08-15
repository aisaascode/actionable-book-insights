export type Idea = {
  title: string;
  summary: string;
  useCase: string;
  steps: string[];
};

export type DayPlan = {
  day: number;
  focus: string;
  action: string;
};

export type BookAnalysis = {
  bookTitle: string;
  overview: string;
  ideas: Idea[];
  plan: DayPlan[];
};

export const CHUNK_SIZE = 12000;
export const MAX_CHUNKS = 5;

export function chunkText(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  for (let i = 0; i < clean.length; i += CHUNK_SIZE) {
    chunks.push(clean.slice(i, i + CHUNK_SIZE));
  }
  if (chunks.length <= MAX_CHUNKS) return chunks;
  // Spread the sampled chunks evenly across the whole book.
  const step = (chunks.length - 1) / (MAX_CHUNKS - 1);
  return Array.from({ length: MAX_CHUNKS }, (_, i) => chunks[Math.round(i * step)]!);
}
