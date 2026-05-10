import {
  openPdf,
  getPdfMetadata,
  extractTextSample,
  extractAllText,
  renderCover,
  type PdfMeta,
} from "./pdfExtract";
import { buildChapters } from "./structure";
import { buildEpub } from "./buildEpub";
import {
  looksScanned,
  ocrAllPages,
  SECONDS_PER_PAGE_ESTIMATE,
  type OcrAbortSignal,
} from "./ocr";

export type InspectResult = {
  pageCount: number;
  isScanned: boolean;
  estimatedOcrSeconds: number;
  meta: PdfMeta;
};

export type ConvertStage = "extract" | "ocr" | "build";

export type ConvertOptions = {
  detectChapters: boolean;
  includeCover: boolean;
  useOcr: boolean;
  title?: string;
  author?: string;
  abort?: OcrAbortSignal;
  onProgress?: (stage: ConvertStage, current: number, total: number) => void;
};

export type ConvertResult = {
  blob: Blob;
  filename: string;
  chapterCount: number;
  pageCount: number;
  hasCover: boolean;
  usedOcr: boolean;
};

export async function inspectPdf(file: File): Promise<InspectResult> {
  const pdf = await openPdf(file);
  try {
    const meta = await getPdfMetadata(pdf);
    const sample = await extractTextSample(pdf, 3);
    const isScanned = looksScanned(sample);
    return {
      pageCount: pdf.numPages,
      isScanned,
      estimatedOcrSeconds: pdf.numPages * SECONDS_PER_PAGE_ESTIMATE,
      meta,
    };
  } finally {
    await pdf.destroy();
  }
}

export async function convertPdfToEpub(
  file: File,
  opts: ConvertOptions,
): Promise<ConvertResult> {
  const pdf = await openPdf(file);
  let pages: string[];
  let cover;
  let meta: PdfMeta;
  try {
    meta = await getPdfMetadata(pdf);
    cover = opts.includeCover ? await renderCover(pdf) : undefined;

    if (opts.useOcr) {
      pages = await ocrAllPages(
        pdf,
        (c, t) => opts.onProgress?.("ocr", c, t),
        opts.abort,
      );
    } else {
      pages = await extractAllText(pdf, (c, t) =>
        opts.onProgress?.("extract", c, t),
      );
    }
  } finally {
    await pdf.destroy();
  }

  const chapters = buildChapters(pages, opts.detectChapters);
  opts.onProgress?.("build", 0, 1);

  const baseName = file.name.replace(/\.pdf$/i, "");
  const title = opts.title?.trim() || meta.title || prettifyFilename(baseName);
  const author = opts.author?.trim() || meta.author || "Unknown";

  const epubCover = cover
    ? { bytes: await cover.blob.arrayBuffer(), mediaType: cover.mediaType, ext: cover.ext }
    : undefined;

  const blob = await buildEpub({ title, author, chapters, cover: epubCover });
  opts.onProgress?.("build", 1, 1);

  return {
    blob,
    filename: `${sanitize(title)}.epub`,
    chapterCount: chapters.length,
    pageCount: pages.length,
    hasCover: !!cover,
    usedOcr: opts.useOcr,
  };
}

function sanitize(s: string): string {
  return s.replace(/[^\w\s.-]+/g, "").replace(/\s+/g, "_") || "book";
}

function prettifyFilename(s: string): string {
  return s
    .replace(/^_?OceanofPDF\.com_?/i, "")
    .replace(/[_]+/g, " ")
    .replace(/\s*-\s*/g, " - ")
    .replace(/\s+/g, " ")
    .trim() || "Untitled";
}
