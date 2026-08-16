import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import {
  BookOpen,
  Bookmark,
  CalendarCheck,
  Clock,
  FileText,
  Lightbulb,
  Loader2,
  ScanText,
  Sparkles,
  Star,
  Target,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { extractPdfText, readableLength } from "@/lib/pdf";
import { analyzeBook } from "@/lib/booklogy.functions";
import type { BookAnalysis } from "@/lib/analysis";
import heroBg from "@/assets/hero-books.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Booklogy — Turn any PDF book into a 7-day action plan" },
      {
        name: "description",
        content:
          "Upload a PDF book — even a scanned one — and get the whole book broken down, real-life uses for your goal, and a 7-day action plan.",
      },
      { property: "og:title", content: "Booklogy — Turn any PDF book into real-life action" },
      {
        property: "og:description",
        content: "Not just summaries. Real use cases and step-by-step actions from any book.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Status = "idle" | "reading" | "ocr" | "thinking";

const GOALS = ["Career", "Business", "Fitness", "Money", "Relationships", "Study"];

const STEPS = [
  {
    icon: Upload,
    title: "Upload your book",
    body: "Any PDF — text or scanned. We handle the reading, including OCR.",
  },
  {
    icon: BookOpen,
    title: "We analyze everything",
    body: "Every part of the book is read and broken down, nothing skipped.",
  },
  {
    icon: CalendarCheck,
    title: "Get your action plan",
    body: "Real-life applications for your goal plus a 7-day plan.",
  },
];

const FEATURES = [
  { icon: FileText, title: "Complete breakdown", body: "Every chapter and concept, fully covered." },
  { icon: Lightbulb, title: "Key insights", body: "The ideas that actually matter, pulled out." },
  { icon: Target, title: "Real-life applications", body: "Exactly where to use it in your life." },
  { icon: CalendarCheck, title: "7-day action plan", body: "A simple week to start applying it." },
  { icon: ScanText, title: "Scanned books too", body: "OCR reads photographed and scanned PDFs." },
  { icon: Bookmark, title: "Tailored to you", body: "Tuned to your goal and who you are." },
];

const BENEFITS = [
  { icon: Clock, title: "Saves you hours", body: "We read the entire book so you don't have to." },
  { icon: BookOpen, title: "Better understanding", body: "Understand books deeply, not superficially." },
  { icon: Target, title: "Take real action", body: "Stop just reading. Start applying." },
];

const TESTIMONIALS = [
  {
    quote: "Booklogy helps me understand books 10x better and saves me so much time.",
    name: "Ananya Sharma",
  },
  { quote: "The 7-day action plan is a game changer. I actually take action now.", name: "Rohan Mehta" },
  { quote: "It's like having a personal book coach who extracts the best for you.", name: "Priya Nair" },
];

const FAQS = [
  {
    q: "What kind of PDFs can I upload?",
    a: "Any book PDF. If the text can be extracted we read it directly; if it's a scan or a photographed book, we automatically run OCR on the pages so you still get the full analysis.",
  },
  {
    q: "Does it read the whole book or just a sample?",
    a: "The whole book. Booklogy walks through every part in order and summarises each one, then pulls out the biggest ideas across the entire text.",
  },
  {
    q: "How is the plan tailored to me?",
    a: "Before analyzing you tell us your goal and who you are — career, business, fitness, student, founder, anything. Every use case, step and day of the plan is written for that context.",
  },
  {
    q: "How long does an analysis take?",
    a: "Usually one to three minutes for a text PDF. Scanned books take longer because each page is read with OCR.",
  },
  {
    q: "Is my book stored anywhere?",
    a: "No. Your PDF is read in your browser and only the text is sent for analysis. Nothing is kept after your result is generated.",
  },
];

function Index() {
  const analyze = useServerFn(analyzeBook);
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState("");
  const [goal, setGoal] = useState("");
  const [audience, setAudience] = useState("");
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
    setProgress("");
    setStatus("reading");
    try {
      const { text, ocr } = await extractPdfText(file, ({ mode, page, total }) => {
        setStatus(mode === "ocr" ? "ocr" : "reading");
        setProgress(`Page ${page} of ${total}`);
      });
      if (readableLength(text) < 500) {
        throw new Error(
          "We couldn't read enough text from this PDF, even with OCR. Try a clearer scan or a text-based PDF.",
        );
      }
      setStatus("thinking");
      setProgress("");
      const analysis = await analyze({
        data: { fileName: file.name, text, goal, audience, ocr },
      });
      setResult(analysis);
      toast.success(ocr ? "Scanned book read with OCR — your plan is ready" : "Your action plan is ready");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Something went wrong while analyzing this book.";
      setError(message);
      toast.error(message);
    } finally {
      setStatus("idle");
      setProgress("");
    }
  }

  const busy = status !== "idle";

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroBg.url}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-10 size-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-background/35" />
        <div className="mx-auto w-full max-w-3xl px-5 pb-16 pt-16 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/85 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5 text-primary" /> Read less, do more
          </span>
          <h1 className="mt-5 text-4xl leading-[1.1] sm:text-6xl">
            The whole book, turned into <em className="text-primary">real-life action</em>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-foreground/80">
            Upload a PDF — even a scanned one — and get the complete breakdown. Every part
            summarised, plus exactly where you can use it in your life and a 7-day action plan.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (!busy) void handleFile(e.dataTransfer.files[0]);
            }}
            className="mx-auto mt-9 max-w-xl rounded-2xl border-2 border-dashed border-border bg-card/85 p-7 shadow-paper backdrop-blur"
          >
            <div className="mb-6 space-y-3 text-left">
              <div>
                <Label htmlFor="goal" className="text-xs uppercase tracking-wide text-muted-foreground">
                  What's your goal?
                </Label>
                <Input
                  id="goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. grow my business, get fitter, switch careers"
                  className="mt-1.5 bg-card"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {GOALS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGoal(g)}
                      className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label
                  htmlFor="audience"
                  className="text-xs uppercase tracking-wide text-muted-foreground"
                >
                  Who are you?
                </Label>
                <Input
                  id="audience"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g. student, founder, working parent, sales manager"
                  className="mt-1.5 bg-card"
                />
              </div>
            </div>

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
                    : status === "ocr"
                      ? "Scanned book detected — reading the pages with OCR…"
                      : "Analyzing the whole book and mapping it to your goal…"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {fileName}
                  {progress ? ` · ${progress}` : ""}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="size-6 text-primary" />
                <p className="text-sm font-medium">Drag &amp; drop your book PDF here</p>
                <Button onClick={() => inputRef.current?.click()}>Choose a PDF</Button>
                <p className="text-xs text-muted-foreground">
                  Text or scanned PDFs · free plan includes 1 book a month
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

      {/* How it works */}
      <section className="bg-secondary/50 py-16">
        <div className="mx-auto w-full max-w-5xl px-5 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">How it works</p>
          <h2 className="mt-3 text-3xl sm:text-4xl">
            From books to action in <em className="text-primary">3 simple steps</em>
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="rounded-2xl border border-border bg-card p-6 text-left shadow-paper"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {i + 1}
                  </span>
                  <step.icon className="size-5 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-xl">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="py-16">
        <div className="mx-auto w-full max-w-5xl px-5 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">What you get</p>
          <h2 className="mt-3 text-3xl sm:text-4xl">
            Everything you need, <em className="text-primary">in one place</em>
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6 text-left shadow-paper">
                <span className="flex size-10 items-center justify-center rounded-full bg-secondary">
                  <f.icon className="size-5 text-primary" />
                </span>
                <h3 className="mt-4 font-display text-lg">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-secondary/50 py-16">
        <div className="mx-auto w-full max-w-4xl px-5">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
            What it's in action
          </p>
          <h2 className="mt-3 text-center text-3xl sm:text-4xl">Here's what you'll get</h2>
          <div className="mt-10 space-y-4">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="flex gap-4 rounded-2xl border border-border bg-card p-6 shadow-paper"
              >
                <b.icon className="mt-1 size-5 shrink-0 text-primary" />
                <div>
                  <h3 className="font-display text-lg">{b.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{b.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="mx-auto w-full max-w-5xl px-5 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Trusted by readers
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl">Loved by learners and doers worldwide</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.name}
                className="rounded-2xl border border-border bg-card p-6 text-left shadow-paper"
              >
                <div className="flex gap-0.5 text-accent">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-3 text-sm text-muted-foreground">"{t.quote}"</blockquote>
                <figcaption className="mt-4 flex items-center gap-2 text-sm font-medium">
                  <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs">
                    {t.name.charAt(0)}
                  </span>
                  {t.name}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-secondary/50 py-16">
        <div className="mx-auto w-full max-w-3xl px-5">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">FAQ</p>
          <h2 className="mt-3 text-center text-3xl sm:text-4xl">Questions, answered</h2>
          <Accordion type="single" collapsible className="mt-8">
            {FAQS.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger className="text-left font-display text-lg">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-16">
        <div className="mx-auto w-full max-w-4xl rounded-3xl bg-primary p-10 text-center text-primary-foreground shadow-paper">
          <h2 className="font-display text-3xl sm:text-4xl">Ready to turn knowledge into action?</h2>
          <p className="mx-auto mt-3 max-w-lg text-primary-foreground/80">
            Upload your first book and get started for free today.
          </p>
          <Button
            variant="secondary"
            className="mt-6"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Upload your book
          </Button>
        </div>
      </section>
    </div>
  );
}
