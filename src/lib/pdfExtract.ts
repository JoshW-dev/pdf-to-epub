import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type {
  PDFDocumentProxy,
  PDFPageProxy,
  TextItem,
} from "pdfjs-dist/types/src/display/api";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export type PdfMeta = {
  title?: string;
  author?: string;
};

export type CoverImage = {
  blob: Blob;
  mediaType: string;
  ext: string;
};

export type PageProgress = (current: number, total: number) => void;

export async function openPdf(file: File): Promise<PDFDocumentProxy> {
  const data = await file.arrayBuffer();
  return pdfjsLib.getDocument({ data }).promise;
}

export async function getPdfMetadata(pdf: PDFDocumentProxy): Promise<PdfMeta> {
  const meta: PdfMeta = {};
  try {
    const m = await pdf.getMetadata();
    const info = m.info as Record<string, unknown> | undefined;
    if (info) {
      if (typeof info.Title === "string" && info.Title.trim())
        meta.title = info.Title.trim();
      if (typeof info.Author === "string" && info.Author.trim())
        meta.author = info.Author.trim();
    }
  } catch {
    // metadata is optional
  }
  return meta;
}

export async function extractAllText(
  pdf: PDFDocumentProxy,
  onProgress?: PageProgress,
): Promise<string[]> {
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(itemsToText(content.items as TextItem[]));
    page.cleanup();
    onProgress?.(i, pdf.numPages);
  }
  return pages;
}

export async function extractTextSample(
  pdf: PDFDocumentProxy,
  sampleSize = 3,
): Promise<string[]> {
  const n = Math.min(sampleSize, pdf.numPages);
  const out: string[] = [];
  for (let i = 1; i <= n; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    out.push(itemsToText(content.items as TextItem[]));
    page.cleanup();
  }
  return out;
}

export async function renderCover(
  pdf: PDFDocumentProxy,
): Promise<CoverImage | undefined> {
  if (pdf.numPages === 0) return undefined;
  try {
    const coverPage = await pdf.getPage(1);
    const cover = await renderPageToCover(coverPage);
    coverPage.cleanup();
    return cover;
  } catch {
    return undefined;
  }
}

export async function renderPageToCanvas(
  page: PDFPageProxy,
  scale: number,
): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  // pdfjs v5 can hang on a detached canvas; mount off-screen.
  canvas.style.position = "fixed";
  canvas.style.left = "-99999px";
  canvas.style.top = "-99999px";
  canvas.style.pointerEvents = "none";
  document.body.appendChild(canvas);
  try {
    const renderTask = page.render({
      canvas,
      viewport,
      background: "#ffffff",
    } as Parameters<PDFPageProxy["render"]>[0]);
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("page render timeout")), 30000),
    );
    await Promise.race([renderTask.promise, timeout]);
    return canvas;
  } catch (err) {
    canvas.remove();
    throw err;
  }
}

async function renderPageToCover(page: PDFPageProxy): Promise<CoverImage | undefined> {
  const baseViewport = page.getViewport({ scale: 1 });
  const targetWidth = 1200;
  const scale = Math.min(targetWidth / baseViewport.width, 3);
  const canvas = await renderPageToCanvas(page, scale);
  try {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85),
    );
    if (!blob) return undefined;
    return { blob, mediaType: "image/jpeg", ext: "jpg" };
  } finally {
    canvas.remove();
  }
}

function itemsToText(items: TextItem[]): string {
  if (items.length === 0) return "";
  // pdfjs gives transform = [a, b, c, d, e, f] where e=x, f=y (baseline).
  // Group items into lines by y-coordinate (with tolerance), then sort by x.
  type Line = { y: number; items: TextItem[] };
  const lines: Line[] = [];
  const yTolerance = 2;

  for (const item of items) {
    const y = item.transform[5];
    let line = lines.find((l) => Math.abs(l.y - y) <= yTolerance);
    if (!line) {
      line = { y, items: [] };
      lines.push(line);
    }
    line.items.push(item);
  }

  // Top of page first (higher y first in PDF coords)
  lines.sort((a, b) => b.y - a.y);
  for (const line of lines) {
    line.items.sort((a, b) => a.transform[4] - b.transform[4]);
  }

  return lines
    .map((line) => line.items.map((it) => it.str).join("").replace(/\s+/g, " ").trim())
    .filter((l) => l.length > 0)
    .join("\n");
}
