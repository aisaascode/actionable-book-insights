export type ExtractProgress = (info: { mode: "text" | "ocr"; page: number; total: number }) => void;

const MAX_PAGES = 400;
const MAX_OCR_PAGES = 40;

/**
 * Reads a PDF. Tries the embedded text layer first; if the book is a scan
 * (little or no extractable text) it falls back to OCR on the rendered pages.
 */
export async function extractPdfText(
  file: File,
  onProgress?: ExtractProgress,
): Promise<{ text: string; ocr: boolean }> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const total = Math.min(doc.numPages, MAX_PAGES);

  let text = "";
  for (let i = 1; i <= total; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => ("str" in item ? item.str : "")).join(" ") + "\n";
    onProgress?.({ mode: "text", page: i, total });
  }

  if (readableLength(text) >= 500) return { text: text.trim(), ocr: false };

  // Scanned book → OCR the rendered pages.
  const { createWorker } = await import("tesseract.js");
  const ocrWorker = await createWorker("eng");
  const ocrPages = Math.min(doc.numPages, MAX_OCR_PAGES);
  let ocrText = "";
  try {
    for (let i = 1; i <= ocrPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) break;
      await page.render({ canvas, canvasContext: ctx, viewport } as never).promise;
      const { data } = await ocrWorker.recognize(canvas);
      ocrText += data.text + "\n";
      canvas.width = 0;
      canvas.height = 0;
      onProgress?.({ mode: "ocr", page: i, total: ocrPages });
    }
  } finally {
    await ocrWorker.terminate();
  }

  return { text: ocrText.trim(), ocr: true };
}

export function readableLength(text: string) {
  return text.replace(/\s/g, "").length;
}
