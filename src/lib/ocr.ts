import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import { renderPageToCanvas, type PageProgress } from "./pdfExtract";

// Per-page time estimate for English OCR on a modern laptop, used for UI hints.
export const SECONDS_PER_PAGE_ESTIMATE = 8;

export type OcrAbortSignal = { aborted: boolean };

// Heuristic: if first sample pages have very little text, the PDF is probably
// scanned/image-only. Threshold is per-page average.
export function looksScanned(samplePages: string[]): boolean {
  if (samplePages.length === 0) return false;
  const total = samplePages.reduce((s, p) => s + p.replace(/\s+/g, "").length, 0);
  const avg = total / samplePages.length;
  return avg < 50;
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
