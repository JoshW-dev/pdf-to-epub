// Pure-data site + per-conversion configuration.
//
// This module is intentionally free of any React or browser imports so it can be
// consumed equally by the client bundle, the SSR head-builder, and the sitemap
// generator. Every conversion page on the site is described by one
// `ConversionConfig`; adding a new converter is a matter of adding an entry here
// (plus a widget component) — this is the "one template, many pages" moat.

export const SITE_URL = "https://convert2epub.online";
export const SITE_NAME = "Convert2EPUB";
export const SITE_TAGLINE = "Free, private ebook converters that run in your browser";
export const GITHUB_URL = "https://github.com/JoshW-dev/pdf-to-epub";
export const OG_IMAGE_PATH = "/og-image.png";

export type FaqItem = { q: string; a: string };
export type HowToStep = { title: string; body: string };
export type Feature = { title: string; body: string };
export type RelatedLink = { path: string; label: string; blurb: string };

export type ConversionConfig = {
  /** url-safe identifier, e.g. "pdf-to-epub" */
  slug: string;
  /** served path, e.g. "/" or "/epub-to-pdf" */
  path: string;
  fromFormat: string;
  toFormat: string;

  // --- <head> / SEO ---
  title: string;
  metaDescription: string;

  // --- visible, crawlable page copy ---
  h1: string;
  introLead: string;
  introBody: string;
  /** short reassurance line shown directly under the widget */
  trustLine: string;

  howToHeading: string;
  steps: HowToStep[];

  featuresHeading: string;
  features: Feature[];

  aboutHeading: string;
  aboutParas: string[];

  faqHeading: string;
  faqs: FaqItem[];

  related: RelatedLink[];
};

/** Absolute canonical URL for a config's page. */
export function canonicalUrl(config: ConversionConfig): string {
  return config.path === "/" ? `${SITE_URL}/` : `${SITE_URL}${config.path}`;
}

export const pdfToEpubConfig: ConversionConfig = {
  slug: "pdf-to-epub",
  path: "/",
  fromFormat: "PDF",
  toFormat: "EPUB",

  title: "PDF to EPUB Converter – Free & Private | Convert2EPUB",
  metaDescription:
    "Convert PDF to EPUB free, right in your browser. No signup, no uploads — your files never leave your device. Reflowable ebooks for Kindle, Kobo & Apple Books.",

  h1: "PDF to EPUB Converter",
  introLead: "Convert PDF to EPUB free — no signup, no uploads, no waiting.",
  introBody:
    "Drop in a PDF and get back a clean, reflowable EPUB that adapts to any screen. Everything runs locally in your browser, so your file never leaves your device. Text PDFs convert instantly, and scanned books are detected and read with built-in OCR.",
  trustLine: "Files never leave your device · runs entirely in your browser",

  howToHeading: "How to convert a PDF to EPUB",
  steps: [
    {
      title: "Add your PDF",
      body: "Drag a PDF onto the box above or click to choose a file. Nothing uploads — the conversion happens entirely on your device.",
    },
    {
      title: "Let it convert",
      body: "We extract the text, detect chapters, and rebuild it as a reflowable EPUB. Scanned PDFs are spotted automatically and read with built-in OCR.",
    },
    {
      title: "Download your EPUB",
      body: "Save the finished EPUB and open it in Apple Books, Kindle, Kobo, Calibre, or any e-reader app.",
    },
  ],

  featuresHeading: "Why convert PDF to EPUB here",
  features: [
    {
      title: "100% free, no signup",
      body: "No account, no email, no watermark, no per-file limits. Convert as many PDFs to EPUB as you like.",
    },
    {
      title: "Private by design",
      body: "Unlike most online converters, your PDF is never uploaded to a server. The whole conversion runs in your browser, so sensitive documents stay with you.",
    },
    {
      title: "Reflowable & e-reader-ready",
      body: "EPUB text reflows to fit any screen and font size — far more comfortable than pinching and scrolling a fixed PDF on a phone or e-ink reader.",
    },
    {
      title: "Automatic chapter detection",
      body: "We split on headings like “Chapter 1” and “Prologue” so your ebook has a real, navigable table of contents.",
    },
    {
      title: "Handles scanned PDFs",
      body: "No embedded text? We detect it and run OCR right in the browser to pull readable text out of scanned pages.",
    },
    {
      title: "Works everywhere",
      body: "The EPUB you get works in Apple Books, Google Play Books, Kobo, and Calibre — and imports straight into Kindle.",
    },
  ],

  aboutHeading: "PDF to EPUB, explained",
  aboutParas: [
    "PDF and EPUB solve different problems. A PDF is a fixed-layout format — every page is frozen at a set size, which is great for printing but painful to read on a phone or e-reader, where you end up pinching and scrolling. EPUB is reflowable: the text adapts to your screen, your font, and your preferred size, the way a proper ebook should.",
    "Converting a PDF to EPUB means pulling the text out of those fixed pages and repackaging it as flowing chapters. This converter does exactly that, locally: it reads the text layer of your PDF (or runs OCR on scans), detects chapter breaks, carries over the cover, and writes a valid EPUB 3 file you can open in any reader.",
    "Because everything happens in your browser, it's genuinely free and genuinely private — there's no upload step, no queue, and no server holding onto your book. It's the simplest safe way to convert a PDF to EPUB without installing desktop software like Calibre.",
  ],

  faqHeading: "PDF to EPUB — frequently asked questions",
  faqs: [
    {
      q: "Is this PDF to EPUB converter free?",
      a: "Yes — completely free, with no signup, no email, and no limit on how many files you convert. There are no watermarks and no paid tier.",
    },
    {
      q: "Is it safe to convert my PDF here?",
      a: "Yes. Your PDF never leaves your device — the conversion runs entirely in your browser, so nothing is uploaded to a server. That makes it safe even for private or sensitive documents.",
    },
    {
      q: "Do I need to install anything or create an account?",
      a: "No. It works right in your web browser on any device. There's nothing to install and no account to create.",
    },
    {
      q: "Can it convert scanned PDFs?",
      a: "Yes. If your PDF has no embedded text, the converter detects it and runs OCR (optical character recognition) to read the text from the page images. OCR is slower and currently supports English.",
    },
    {
      q: "Will the EPUB work on my Kindle?",
      a: "Yes. Kindle reads EPUB — email the file to your Send to Kindle address or add it through the Kindle app and Amazon converts it for you. It also opens directly in Apple Books, Kobo, Google Play Books, and Calibre.",
    },
    {
      q: "Can I convert more than one PDF at a time?",
      a: "You can convert files one after another — each takes only a moment for a text PDF. Batch conversion isn't supported yet, but there's no limit on how many you can do in a row.",
    },
    {
      q: "Are chapters and the cover kept?",
      a: "Yes. The converter detects chapter headings to build a navigable table of contents and uses the PDF's first page as the cover by default. You can also set the title and author yourself.",
    },
    {
      q: "Is there a file size limit?",
      a: "There's no fixed limit — because it runs on your device, the practical ceiling is your device's memory. Large or scanned books simply take a little longer.",
    },
    {
      q: "Why convert a PDF to EPUB at all?",
      a: "EPUB reflows text to fit any screen and font size, so books are far more comfortable to read on phones and e-readers than fixed-layout PDFs. EPUB also supports proper chapter navigation and adjustable typography.",
    },
  ],

  related: [
    {
      path: "/epub-to-pdf",
      label: "EPUB to PDF Converter",
      blurb: "Going the other way? Turn an EPUB back into a shareable, printable PDF.",
    },
  ],
};

export const epubToPdfConfig: ConversionConfig = {
  slug: "epub-to-pdf",
  path: "/epub-to-pdf",
  fromFormat: "EPUB",
  toFormat: "PDF",

  title: "EPUB to PDF Converter – Free & Private | Convert2EPUB",
  metaDescription:
    "Convert EPUB to PDF free in your browser. No signup, no uploads — your ebook never leaves your device. Get a clean, printable, shareable PDF in seconds.",

  h1: "EPUB to PDF Converter",
  introLead: "Convert EPUB to PDF free — no signup, no uploads, no waiting.",
  introBody:
    "Drop in an EPUB ebook and get back a clean PDF you can print, annotate, or share anywhere. Everything runs locally in your browser, so your file never leaves your device and the text stays real, selectable text.",
  trustLine: "Files never leave your device · runs entirely in your browser",

  howToHeading: "How to convert an EPUB to PDF",
  steps: [
    {
      title: "Add your EPUB",
      body: "Drag an .epub file onto the box above or click to choose one. Nothing uploads — it all happens on your device.",
    },
    {
      title: "Let it convert",
      body: "We read the ebook's chapters in order and lay the text and images out into clean, paginated PDF pages.",
    },
    {
      title: "Download your PDF",
      body: "Save the finished PDF and open, print, or share it from any device or app.",
    },
  ],

  featuresHeading: "Why convert EPUB to PDF here",
  features: [
    {
      title: "100% free, no signup",
      body: "No account, no email, no watermark. Convert as many EPUBs to PDF as you want.",
    },
    {
      title: "Private by design",
      body: "Your EPUB is never uploaded. The conversion runs in your browser, so your reading and your files stay with you.",
    },
    {
      title: "Print- & share-ready",
      body: "PDF is the universal format for printing, emailing, and annotating — perfect when you need a fixed page that opens the same everywhere.",
    },
    {
      title: "Keeps chapters & images",
      body: "Chapters are laid out in reading order and inline images are carried into the PDF.",
    },
    {
      title: "Selectable text",
      body: "The text in your PDF stays real, selectable text — not a flat screenshot — so you can search, copy, and highlight it.",
    },
    {
      title: "Works everywhere",
      body: "The PDF you get opens in every browser, phone, and PDF reader, with nothing to install.",
    },
  ],

  aboutHeading: "EPUB to PDF, explained",
  aboutParas: [
    "EPUB is the standard ebook format — reflowable text that adapts to any screen. But sometimes you need the opposite: a fixed page. PDF is the format everyone can open, print, mark up, and email, and it looks identical on every device.",
    "Converting an EPUB to PDF means taking the ebook's flowing chapters and laying them onto fixed pages. This converter reads the EPUB's spine in reading order, pulls the text and images from each chapter, and writes them into a clean, paginated PDF — keeping the text as real, selectable text rather than a screenshot.",
    "It all runs in your browser, so it's free and private: there's no upload, no queue, and no server keeping a copy of your book. It's the quickest safe way to turn an EPUB into a PDF without installing Calibre or another desktop app.",
  ],

  faqHeading: "EPUB to PDF — frequently asked questions",
  faqs: [
    {
      q: "Is this EPUB to PDF converter free?",
      a: "Yes — fully free, with no signup, no email, and no limit on the number of files. No watermarks and no paid tier.",
    },
    {
      q: "Is it safe? Does my EPUB get uploaded?",
      a: "It's safe — your EPUB never leaves your device. The conversion runs entirely in your browser, so nothing is uploaded to any server.",
    },
    {
      q: "Do I need an account or any software?",
      a: "No. It runs in your web browser on any device, with nothing to install and no account to create.",
    },
    {
      q: "Is the text in the PDF selectable?",
      a: "Yes. The converter lays out real, selectable text, so you can search, copy, and highlight inside the resulting PDF rather than getting a flat image.",
    },
    {
      q: "Are images and chapters kept?",
      a: "Chapters are placed in reading order and inline images are carried into the PDF. Very complex layouts (heavy CSS or multi-column designs) are simplified into a clean, readable flow.",
    },
    {
      q: "Can I open the PDF on any device?",
      a: "Yes. PDF is universal — the file opens in any browser, phone, tablet, or desktop PDF reader, and it prints the same everywhere.",
    },
    {
      q: "Is there a file size limit?",
      a: "There's no fixed limit. Since it runs on your device, very large ebooks just take a little longer to lay out.",
    },
    {
      q: "Why convert EPUB to PDF?",
      a: "PDF gives you a fixed, printable page that looks the same everywhere — ideal for printing, annotating, emailing, or submitting a document, where a reflowable EPUB isn't accepted.",
    },
  ],

  related: [
    {
      path: "/",
      label: "PDF to EPUB Converter",
      blurb: "Need it the other way? Convert a PDF into a reflowable EPUB ebook.",
    },
  ],
};

export const ALL_CONFIGS: ConversionConfig[] = [pdfToEpubConfig, epubToPdfConfig];
