// Client-side EPUB -> PDF converter.
//
// Unzips the EPUB, follows the OPF spine in reading order, walks each chapter's
// DOM into a sequence of text/heading/image blocks, and lays those out onto
// paginated PDF pages with jsPDF. Text stays as real, selectable text; inline
// images are embedded. Runs entirely in the browser — the file is never uploaded.
//
// Scope: standard reflowable EPUB 2/3 with Latin-script text. jsPDF's built-in
// fonts cover Latin-1, so typographic punctuation is normalized to ASCII to avoid
// mojibake; non-Latin scripts (CJK, Cyrillic, Arabic) are out of scope for now.

import JSZip from "jszip";
import { jsPDF } from "jspdf";

export type PdfPageSize = "a4" | "letter" | "a5";

export type EpubToPdfOptions = {
  pageSize: PdfPageSize;
  onProgress?: (current: number, total: number) => void;
};

export type EpubToPdfResult = {
  blob: Blob;
  filename: string;
  pageCount: number;
  chapterCount: number;
};

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "para"; text: string }
  | { type: "image"; path: string };

// --- path helpers ---------------------------------------------------------

function dirname(path: string): string {
  const i = path.lastIndexOf("/");
  return i === -1 ? "" : path.slice(0, i);
}

/** Resolve a relative href against a base directory, collapsing "." and "..". */
function resolvePath(baseDir: string, href: string): string {
  const clean = href.split("#")[0].split("?")[0];
  if (!clean) return "";
  const stack = baseDir ? baseDir.split("/") : [];
  for (let part of clean.split("/")) {
    try {
      part = decodeURIComponent(part);
    } catch {
      /* leave as-is if not valid percent-encoding */
    }
    if (part === "" || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return stack.join("/");
}

/** Look up a zip entry, falling back to a case-insensitive match. */
function findEntry(zip: JSZip, path: string): JSZip.JSZipObject | null {
  const direct = zip.file(path);
  if (direct) return direct;
  const lower = path.toLowerCase();
  for (const name of Object.keys(zip.files)) {
    if (name.toLowerCase() === lower) return zip.files[name];
  }
  return null;
}

// --- EPUB parsing ---------------------------------------------------------

async function readText(zip: JSZip, path: string): Promise<string | null> {
  const entry = findEntry(zip, path);
  return entry ? entry.async("text") : null;
}

function parseXml(text: string, mime: DOMParserSupportedType): Document {
  return new DOMParser().parseFromString(text, mime);
}

/** First element whose local name matches, searched depth-first. */
function firstByLocalName(root: Element | Document, localName: string): Element | null {
  const all = root.getElementsByTagName("*");
  for (let i = 0; i < all.length; i++) {
    if (all[i].localName === localName) return all[i];
  }
  return null;
}

type EpubManifest = {
  opfDir: string;
  title: string;
  author: string;
  /** spine: ordered list of resolved XHTML document paths */
  documents: string[];
  /** manifest id -> resolved path + media type */
  items: Map<string, { path: string; mediaType: string }>;
};

async function parseEpub(zip: JSZip): Promise<EpubManifest> {
  const containerXml = await readText(zip, "META-INF/container.xml");
  if (!containerXml) {
    throw new Error("This doesn't look like a valid EPUB (no container.xml).");
  }
  const container = parseXml(containerXml, "application/xml");
  const rootfile = firstByLocalName(container, "rootfile");
  const opfPath = rootfile?.getAttribute("full-path");
  if (!opfPath) throw new Error("Couldn't find the EPUB's package file (OPF).");

  const opfText = await readText(zip, opfPath);
  if (!opfText) throw new Error("Couldn't read the EPUB's package file (OPF).");
  const opf = parseXml(opfText, "application/xml");
  const opfDir = dirname(opfPath);

  const title = firstByLocalName(opf, "title")?.textContent?.trim() || "";
  const author = firstByLocalName(opf, "creator")?.textContent?.trim() || "";

  // manifest: id -> { path, mediaType }
  const items = new Map<string, { path: string; mediaType: string }>();
  const manifest = firstByLocalName(opf, "manifest");
  if (manifest) {
    for (const item of Array.from(manifest.getElementsByTagName("*"))) {
      if (item.localName !== "item") continue;
      const id = item.getAttribute("id");
      const href = item.getAttribute("href");
      if (!id || !href) continue;
      items.set(id, {
        path: resolvePath(opfDir, href),
        mediaType: item.getAttribute("media-type") || "",
      });
    }
  }

  // spine: ordered idrefs -> XHTML document paths
  const documents: string[] = [];
  const spine = firstByLocalName(opf, "spine");
  if (spine) {
    for (const ref of Array.from(spine.getElementsByTagName("*"))) {
      if (ref.localName !== "itemref") continue;
      if (ref.getAttribute("linear") === "no") continue;
      const idref = ref.getAttribute("idref");
      if (!idref) continue;
      const item = items.get(idref);
      if (item && /x?html/.test(item.mediaType)) documents.push(item.path);
    }
  }

  if (documents.length === 0) {
    throw new Error("Couldn't find readable chapters in this EPUB.");
  }
  return { opfDir, title, author, documents, items };
}

// --- DOM -> blocks --------------------------------------------------------

const HEADINGS: Record<string, number> = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
  h6: 6,
};
const TEXT_BLOCKS = new Set([
  "p",
  "li",
  "blockquote",
  "pre",
  "figcaption",
  "dd",
  "dt",
  "caption",
  "td",
  "th",
]);

function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Walk a chapter body into an ordered list of renderable blocks. */
function extractBlocks(body: HTMLElement, chapterDir: string): Block[] {
  const blocks: Block[] = [];

  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === 3 /* TEXT */) {
        const text = normalizeWhitespace(child.textContent || "");
        if (text) blocks.push({ type: "para", text });
        continue;
      }
      if (child.nodeType !== 1 /* ELEMENT */) continue;
      const el = child as Element;
      const tag = el.tagName.toLowerCase();

      if (tag === "img" || tag === "image") {
        const src = el.getAttribute("src") || el.getAttribute("xlink:href");
        if (src) blocks.push({ type: "image", path: resolvePath(chapterDir, src) });
        continue;
      }
      if (tag === "script" || tag === "style" || tag === "head") continue;

      if (tag in HEADINGS) {
        const text = normalizeWhitespace(el.textContent || "");
        if (text) blocks.push({ type: "heading", level: HEADINGS[tag], text });
        // headings rarely contain images, but emit any to be safe
        for (const img of Array.from(el.getElementsByTagName("img"))) {
          const src = img.getAttribute("src");
          if (src) blocks.push({ type: "image", path: resolvePath(chapterDir, src) });
        }
        continue;
      }

      if (TEXT_BLOCKS.has(tag)) {
        const imgs = Array.from(el.getElementsByTagName("img"));
        const text = normalizeWhitespace(el.textContent || "");
        const prefix = tag === "li" ? "•  " : "";
        if (text) blocks.push({ type: "para", text: prefix + text });
        for (const img of imgs) {
          const src = img.getAttribute("src");
          if (src) blocks.push({ type: "image", path: resolvePath(chapterDir, src) });
        }
        continue;
      }

      // structural container (div, section, article, body, ...) -> recurse
      walk(el);
    }
  };

  walk(body);
  return blocks;
}

// --- image helpers --------------------------------------------------------

function imageFormat(path: string, mediaType: string): "JPEG" | "PNG" | null {
  const m = mediaType.toLowerCase();
  const p = path.toLowerCase();
  if (m.includes("jpeg") || m.includes("jpg") || /\.jpe?g$/.test(p)) return "JPEG";
  if (m.includes("png") || /\.png$/.test(p)) return "PNG";
  return null; // gif / svg / webp etc. are skipped
}

function loadImageSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new Error("image decode failed"));
    img.src = dataUrl;
  });
}

// --- typography -----------------------------------------------------------

/** Map common typographic Unicode to ASCII so jsPDF's standard fonts render it. */
function sanitizeForPdf(text: string): string {
  return text
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[–—―]/g, "-")
    .replace(/•/g, "-")
    .replace(/…/g, "...");
}

function sanitize(name: string): string {
  return name.replace(/[^\w\s.-]+/g, "").replace(/\s+/g, "_") || "book";
}

// --- conversion -----------------------------------------------------------

export async function convertEpubToPdf(
  file: File,
  opts: EpubToPdfOptions,
): Promise<EpubToPdfResult> {
  const zip = await JSZip.loadAsync(file);
  const epub = await parseEpub(zip);

  const doc = new jsPDF({ unit: "pt", format: opts.pageSize, orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 56;
  const contentW = pageW - margin * 2;
  const bottom = pageH - margin;
  const bodySize = 11.5;
  const leading = bodySize * 1.45;

  let y = margin;
  doc.setFont("times", "normal");
  doc.setFontSize(bodySize);

  const newPage = () => {
    doc.addPage();
    y = margin;
  };
  const ensureSpace = (needed: number) => {
    if (y + needed > bottom) newPage();
  };

  const writeText = (text: string, size: number, style: "normal" | "bold") => {
    doc.setFont("times", style);
    doc.setFontSize(size);
    const lineH = size * 1.42;
    const lines = doc.splitTextToSize(sanitizeForPdf(text), contentW) as string[];
    for (const line of lines) {
      ensureSpace(lineH);
      doc.text(line, margin, y);
      y += lineH;
    }
  };

  // de-dupe identical images (e.g. repeated logos) across the whole book
  const imageCache = new Map<string, { dataUrl: string; format: "JPEG" | "PNG"; ratio: number } | null>();

  const placeImage = async (path: string) => {
    let cached = imageCache.get(path);
    if (cached === undefined) {
      cached = null;
      const item = Array.from(epub.items.values()).find((it) => it.path === path);
      const format = imageFormat(path, item?.mediaType || "");
      const entry = format ? findEntry(zip, path) : null;
      if (format && entry) {
        try {
          const base64 = await entry.async("base64");
          const dataUrl = `data:image/${format === "JPEG" ? "jpeg" : "png"};base64,${base64}`;
          const { w, h } = await loadImageSize(dataUrl);
          if (w > 0 && h > 0) cached = { dataUrl, format, ratio: h / w };
        } catch {
          cached = null; // unreadable image -> skip silently
        }
      }
      imageCache.set(path, cached);
    }
    if (!cached) return;

    const drawW = Math.min(contentW, 420);
    const drawH = drawW * cached.ratio;
    const cappedH = Math.min(drawH, bottom - margin);
    const cappedW = cappedH < drawH ? cappedH / cached.ratio : drawW;
    ensureSpace(cappedH);
    const x = margin + (contentW - cappedW) / 2;
    doc.addImage(cached.dataUrl, cached.format, x, y, cappedW, cappedH);
    y += cappedH + leading * 0.5;
  };

  // optional title page
  if (epub.title) {
    y = pageH * 0.38;
    writeText(epub.title, 26, "bold");
    if (epub.author) {
      y += leading * 0.4;
      writeText(epub.author, 14, "normal");
    }
  }

  let firstChapter = !epub.title; // if there's a title page, first chapter starts on a new page

  for (let i = 0; i < epub.documents.length; i++) {
    opts.onProgress?.(i, epub.documents.length);
    const path = epub.documents[i];
    const html = await readText(zip, path);
    if (!html) continue;
    const chapterDoc = parseXml(html, "text/html");
    if (!chapterDoc.body) continue;
    const blocks = extractBlocks(chapterDoc.body, dirname(path));
    if (blocks.length === 0) continue;

    if (!firstChapter || y > margin) newPage();
    firstChapter = false;

    for (const block of blocks) {
      if (block.type === "image") {
        await placeImage(block.path);
      } else if (block.type === "heading") {
        const size = block.level <= 1 ? 20 : block.level === 2 ? 16 : 13.5;
        if (y > margin) y += leading * 0.6; // space above heading
        ensureSpace(size * 1.5);
        writeText(block.text, size, "bold");
        y += leading * 0.25;
      } else {
        writeText(block.text, bodySize, "normal");
        y += leading * 0.45; // paragraph spacing
      }
    }
  }
  opts.onProgress?.(epub.documents.length, epub.documents.length);

  const baseName = file.name.replace(/\.epub$/i, "");
  const title = epub.title || baseName || "book";
  doc.setProperties({
    title,
    author: epub.author || "Unknown",
    creator: "Convert2EPUB",
  });

  const blob = doc.output("blob");
  return {
    blob,
    filename: `${sanitize(title)}.pdf`,
    pageCount: doc.getNumberOfPages(),
    chapterCount: epub.documents.length,
  };
}
