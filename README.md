# pdf-to-epub

A simple tool for converting PDFs to EPUBs so you can read them comfortably on
e-readers, phones, or any EPUB-friendly app.

**Try it:** [pdf-to-epub-rho.vercel.app](https://pdf-to-epub-rho.vercel.app)

Drop in a PDF, get an EPUB back. That's it.

## How it works

Everything runs in your browser — your PDF never leaves your device, no upload,
no server, no account. The page uses [PDF.js](https://mozilla.github.io/pdf.js/)
to extract text and render the cover, and [JSZip](https://stuk.github.io/jszip/)
to package a valid EPUB 3.

## Features

- Drag-and-drop or click-to-pick
- Detects chapter boundaries (`Chapter N`, `One`/`Two`/..., `Prologue`, etc.)
- Uses the PDF's first page as the EPUB cover
- Optional title and author overrides; auto-fills from PDF metadata or filename
- 100% client-side; works offline once loaded

## Limitations

- Text-based PDFs only — scanned/image-only PDFs need OCR first
- Inline figures and footnotes aren't preserved
- Complex multi-column layouts may not reflow perfectly

## Local development

```bash
npm install
npm run dev
```

Production build: `npm run build` (output in `dist/`, deploys as a static site).
