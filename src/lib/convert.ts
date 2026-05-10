import { extractPdf } from "./pdfExtract";
import { buildChapters } from "./structure";
import { buildEpub } from "./buildEpub";

export type ConvertOptions = {
  detectChapters: boolean;
  includeCover: boolean;
  title?: string;
  author?: string;
  onProgress?: (stage: "extract" | "build", current: number, total: number) => void;
};

export type ConvertResult = {
  blob: Blob;
  filename: string;
  chapterCount: number;
  pageCount: number;
  hasCover: boolean;
};

export async function convertPdfToEpub(
  file: File,
  opts: ConvertOptions,
): Promise<ConvertResult> {
  const { pages, meta, cover } = await extractPdf(
    file,
    (c, t) => opts.onProgress?.("extract", c, t),
    { renderCover: opts.includeCover },
  );

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
