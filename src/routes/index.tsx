import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { extractPdfText } from "@/lib/pdf";
import { analyzeBook } from "@/lib/booklogy.functions";
import type { BookAnalysis } from "@/lib/analysis";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Booklogy — Turn any PDF book into a 7-day action plan" },
      {
        name: "description",
        content:
          "Upload a PDF book and get the top 5 ideas, a real-life use case for each and a 7-day action plan you can start today.",
      },
      { property: "og:title", content: "Booklogy — Turn any PDF book into a 7-day action plan" },
      {
        property: "og:description",
        content: "Not just summaries. Real use cases and step-by-step actions from any book.",
      },
    ],
  }),
  component: Index,
});

type Status = "idle" | "reading" | "thinking";

function Index() {
  const analyze = useServerFn(analyzeBook);
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<BookAnalysis | null>(null);
  const [error, setError] = useState("");

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF file.");
      return;
    }
    setError("");
    setResult(null);
    setFileName(file.name);
    setStatus("reading");
    try {
      const text = await extractPdfText(file);
      if (text.replace(/\s/g, "").length < 500) {
        throw new Error(
          "We couldn't read any text in this PDF. It looks like a scanned book — try a text-based PDF.",
        );
      }
      setStatus("thinking");
      const analysis = await analyze({ data: { fileName: file.name, text } });
      setResult(analysis);
      toast.success("Your action plan is ready");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Something went wrong while analyzing this book.";
      setError(message);
      toast.error(message);
    } finally {
      setStatus("idle");
    }
  }

  const busy = status !== "idle";

  return (
    <div>
      <section className="bg-hero">
        <div className="mx-auto w-full max-w-3xl px-5 pb-14 pt-16 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" /> Read less, do more
          </span>
          <h1 className="mt-5 text-4xl leading-[1.1] sm:text-6xl">
            The whole book, turned into <em className="text-primary">real-life action</em>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Upload a PDF and get the complete breakdown.
            Booklogy reads the whole book — every part summarised, plus exactly where you can use
            it in real life and a 7-day action plan.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (!busy) void handleFile(e.dataTransfer.files[0]);
            }}
            className="mx-auto mt-10 max-w-xl rounded-2xl border-2 border-dashed border-border bg-card/80 p-9 shadow-paper"
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
            {busy ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="text-sm font-medium">
                  {status === "reading"
                    ? "Reading every page of your PDF…"
                    : "Analyzing the whole book and mapping it to real life…"}
                </p>
                <p className="text-xs text-muted-foreground">{fileName}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="size-6 text-primary" />
                <p className="text-sm font-medium">Drag & drop your book PDF here</p>
                <Button onClick={() => inputRef.current?.click()}>Choose a PDF</Button>
                <p className="text-xs text-muted-foreground">
                  Text-based PDFs only · free plan includes 1 book a month
                </p>
              </div>
            )}
          </div>

          {error && (
            <p className="mx-auto mt-4 max-w-xl rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      </section>

      {result && (
        <section className="mx-auto w-full max-w-3xl px-5 py-14">
          <div className="flex items-start gap-3">
            <FileText className="mt-1 size-5 shrink-0 text-primary" />
            <div>
              <h2 className="text-3xl">{result.bookTitle}</h2>
              <p className="mt-2 text-muted-foreground">{result.overview}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Whole book analyzed · {result.coveredChunks} of {result.totalChunks} parts read
              </p>
            </div>
          </div>

          <h3 className="mt-12 text-2xl">The whole book, part by part</h3>
          <div className="mt-5 space-y-4">
            {result.sections.map((section, i) => (
              <article
                key={section.heading + i}
                className="rounded-2xl border border-border bg-card p-6 shadow-paper"
              >
                <h4 className="font-display text-xl">{section.heading}</h4>
                <p className="mt-2 text-sm text-muted-foreground">{section.summary}</p>
                <p className="mt-3 rounded-lg bg-secondary px-4 py-3 text-sm">
                  <span className="font-medium">Use it in real life: </span>
                  {section.realLife}
                </p>
              </article>
            ))}
          </div>

          <h3 className="mt-12 text-2xl">The 5 ideas that matter most</h3>
          <div className="mt-5 space-y-5">
            {result.ideas.map((idea, i) => (
              <article
                key={idea.title + i}
                className="rounded-2xl border border-border bg-card p-6 shadow-paper"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-2xl text-accent">{i + 1}</span>
                  <h4 className="font-display text-xl">{idea.title}</h4>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{idea.summary}</p>
                <p className="mt-4 rounded-lg bg-secondary px-4 py-3 text-sm">
                  <span className="font-medium">Real life: </span>
                  {idea.useCase}
                </p>
                <ol className="mt-4 space-y-2 text-sm">
                  {idea.steps.map((step, s) => (
                    <li key={s} className="flex gap-3">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">
                        {s + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>

          <h3 className="mt-12 text-2xl">Your 7-day plan</h3>
          <div className="mt-5 space-y-3">
            {result.plan.map((day) => (
              <div
                key={day.day}
                className="flex gap-4 rounded-xl border border-border bg-card p-5 shadow-paper"
              >
                <div className="w-16 shrink-0">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Day</p>
                  <p className="font-display text-3xl leading-none">{day.day}</p>
                </div>
                <div>
                  <p className="font-medium">{day.focus}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{day.action}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-primary/30 bg-secondary p-6 text-center">
            <p className="font-display text-2xl">Want to run this on every book you read?</p>
            <Button asChild className="mt-4">
              <Link to="/pricing">See Pro — $9/month</Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
