import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { chunkText, MAX_CHUNKS, type BookAnalysis } from "./analysis";

const inputSchema = z.object({
  fileName: z.string().min(1),
  text: z.string().min(200, "Not enough readable text"),
});

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

async function callAI(apiKey: string, messages: Array<{ role: string; content: string }>) {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, messages }),
  });
  if (res.status === 429) throw new Error("Rate limit reached. Please try again in a minute.");
  if (res.status === 402) throw new Error("AI credits exhausted. Please top up to keep analyzing.");
  if (!res.ok) throw new Error("The AI service could not process this book right now.");
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? "";
}

function parseJson(raw: string): BookAnalysis {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("The AI response could not be read. Please try again.");
  return JSON.parse(match[0]) as BookAnalysis;
}

export const analyzeBook = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<BookAnalysis> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured for this project.");

    const allChunks = chunkText(data.text);
    const chunks = allChunks.slice(0, MAX_CHUNKS);

    // Read the whole book, part by part, in parallel batches.
    const notes: string[] = [];
    const BATCH = 4;
    for (let i = 0; i < chunks.length; i += BATCH) {
      const batch = chunks.slice(i, i + BATCH);
      const results = await Promise.all(
        batch.map((chunk, j) =>
          callAI(apiKey, [
            {
              role: "system",
              content:
                "You read a part of a book and report everything useful in it: the arguments, lessons, frameworks, examples and numbers. Be concrete and complete, no fluff, no preamble.",
            },
            {
              role: "user",
              content: `Part ${i + j + 1} of ${chunks.length} of the book "${data.fileName}". Summarise everything covered in this part as bullets, and for each bullet note how a normal person could actually use it in real life:\n\n${chunk}`,
            },
          ]),
        ),
      );
      notes.push(...results);
    }

    const raw = await callAI(apiKey, [
      {
        role: "system",
        content:
          "You turn a complete set of book notes into a full, practical breakdown. Reply with JSON only, no markdown fences.",
      },
      {
        role: "user",
        content: `Complete notes covering the whole book "${data.fileName}", in reading order:\n\n${notes
          .map((n, i) => `### Part ${i + 1}\n${n}`)
          .join("\n\n")}\n\nReturn JSON with this exact shape:
{
  "bookTitle": "best guess at the book title",
  "overview": "3-4 sentences covering what the whole book is about and what it helps you do",
  "sections": [ { "heading": "part or theme name", "summary": "3-5 sentences summarising everything this part covers", "realLife": "exactly where and how someone can use this part in real life" } ],
  "ideas": [ { "title": "short idea name", "summary": "exactly 2 sentences", "useCase": "one concrete real-life situation where this applies", "steps": ["3 to 5 step-by-step actions"] } ],
  "plan": [ { "day": 1, "focus": "short focus", "action": "one specific action to do that day" } ]
}
Rules: "sections" must cover the ENTIRE book in order — one section per major part or theme, 5 to 10 sections, nothing important left out. Exactly 5 ideas. Exactly 7 plan days (day 1-7). Every step must be doable today. No generic advice.`,
      },
    ]);

    const parsed = parseJson(raw);
    return {
      ...parsed,
      sections: parsed.sections ?? [],
      ideas: (parsed.ideas ?? []).slice(0, 5),
      plan: (parsed.plan ?? []).slice(0, 7),
      coveredChunks: chunks.length,
      totalChunks: allChunks.length,
    };
  });
