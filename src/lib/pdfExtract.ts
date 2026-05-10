import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { PDFPageProxy, TextItem } from "pdfjs-dist/types/src/display/api";

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

export type ExtractResult = {
  pages: string[];
  meta: PdfMeta;
  cover?: CoverImage;
};

export type ExtractProgress = (current: number, total: number) => void;

export type ExtractOptions = {
  renderCover?: boolean;
};

export async function extractPdf(
  file: File,
  onProgress?: ExtractProgress,
  options: ExtractOptions = {},
): Promise<ExtractResult> {
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  const meta: PdfMeta = {};
  try {
    const m = await pdf.getMetadata();
    const info = m.info as Record<string, unknown> | undefined;
    if (info) {
      if (typeof info.Title === "string" && info.Title.trim()) meta.title = info.Title.trim();
      if (typeof info.Author === "string" && info.Author.trim()) meta.author = info.Author.trim();
    }
  } catch {
    // metadata is optional
  }

  let cover: CoverImage | undefined;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(itemsToText(content.items as TextItem[]));
    if (i === 1 && options.renderCover) {
      try {
        cover = await renderPageToCover(page);
      } catch {
        // cover is optional; carry on
      }
    }
    onProgress?.(i, pdf.numPages);
  }
  await pdf.destroy();
  return { pages, meta, cover };
}

async function renderPageToCover(page: PDFPageProxy): Promise<CoverImage | undefined> {
  const baseViewport = page.getViewport({ scale: 1 });
  const targetWidth = 1200;
  const scale = Math.min(targetWidth / baseViewport.width, 3);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const renderTask = page.render({
    canvasContext: ctx,
    viewport,
    canvas,
  } as Parameters<PDFPageProxy["render"]>[0]);
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("cover render timeout")), 15000),
  );
  await Promise.race([renderTask.promise, timeout]);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85),
  );
  if (!blob) return undefined;
  return { blob, mediaType: "image/jpeg", ext: "jpg" };
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
