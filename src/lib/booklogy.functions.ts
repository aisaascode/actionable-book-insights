import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { chunkText, type BookAnalysis } from "./analysis";

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

    const chunks = chunkText(data.text);

    const notes: string[] = [];
    for (const chunk of chunks) {
      const note = await callAI(apiKey, [
        {
          role: "system",
          content:
            "You extract practical, actionable lessons from book excerpts. Be concrete, skip fluff, no preamble.",
        },
        {
          role: "user",
          content: `Excerpt from "${data.fileName}". List the most practical, applicable lessons in this excerpt as short bullets:\n\n${chunk}`,
        },
      ]);
      notes.push(note);
    }

    const raw = await callAI(apiKey, [
      {
        role: "system",
        content:
          "You turn book insights into real-life action. Reply with JSON only, no markdown fences.",
      },
      {
        role: "user",
        content: `Notes gathered from the book file "${data.fileName}":\n\n${notes.join("\n\n---\n\n")}\n\nReturn JSON with this exact shape:
{
  "bookTitle": "best guess at the book title",
  "overview": "2 sentences on what this book helps you do",
  "ideas": [ { "title": "short idea name", "summary": "exactly 2 sentences", "useCase": "one concrete real-life situation where this applies", "steps": ["3 to 5 step-by-step actions"] } ],
  "plan": [ { "day": 1, "focus": "short focus", "action": "one specific action to do that day" } ]
}
Rules: exactly 5 ideas, exactly 7 plan days (day 1-7), every step must be doable today, no generic advice.`,
      },
    ]);

    const parsed = parseJson(raw);
    return {
      ...parsed,
      ideas: (parsed.ideas ?? []).slice(0, 5),
      plan: (parsed.plan ?? []).slice(0, 7),
    };
  });
