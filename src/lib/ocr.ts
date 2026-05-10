import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import { renderPageToCanvas, type PageProgress } from "./pdfExtract";

// Per-page time estimate for English OCR on a modern laptop, used for UI hints.
export const SECONDS_PER_PAGE_ESTIMATE = 8;

export type OcrAbortSignal = { aborted: boolean };

// Heuristic: a scanned/image-only PDF has effectively no extractable text on
// ANY page. We look at the page with the most characters in the sample —
// if even that page has very little text, treat the whole PDF as scanned.
// Using max rather than avg avoids being misled by blank or near-blank front
// matter (covers, title pages, dedications) at the start of text-based books.
export function looksScanned(samplePages: string[]): boolean {
  if (samplePages.length === 0) return false;
  const maxChars = samplePages.reduce(
    (m, p) => Math.max(m, p.replace(/\s+/g, "").length),
    0,
  );
  return maxChars < 100;
}

export async function ocrAllPages(
  pdf: PDFDocumentProxy,
  onProgress?: PageProgress,
  abort?: OcrAbortSignal,
): Promise<string[]> {
  // Lazy-load tesseract.js so the main bundle doesn't pay for it.
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  const pages: string[] = [];
  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      if (abort?.aborted) throw new Error("OCR aborted");
      const page = await pdf.getPage(i);
      // 2× scale → ~144 DPI, a good speed/accuracy balance for OCR.
      const canvas = await renderPageToCanvas(page, 2);
      try {
        const { data } = await worker.recognize(canvas);
        pages.push(data.text || "");
      } finally {
        canvas.remove();
        page.cleanup();
      }
      onProgress?.(i, pdf.numPages);
    }
  } finally {
    await worker.terminate();
  }
  return pages;
}
