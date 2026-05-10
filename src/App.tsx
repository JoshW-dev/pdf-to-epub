import { useCallback, useRef, useState } from "react";
import { convertPdfToEpub } from "./lib/convert";

type Status =
  | { kind: "idle" }
  | { kind: "working"; stage: string; current: number; total: number; fileName: string }
  | {
      kind: "done";
      url: string;
      filename: string;
      chapters: number;
      pages: number;
      size: number;
      hasCover: boolean;
    }
  | { kind: "error"; message: string };

function App() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [detectChapters, setDetectChapters] = useState(true);
  const [includeCover, setIncludeCover] = useState(true);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setStatus({ kind: "error", message: "Please drop a .pdf file." });
        return;
      }
      setStatus({
        kind: "working",
        stage: "Reading PDF",
        current: 0,
        total: 1,
        fileName: file.name,
      });
      try {
        const result = await convertPdfToEpub(file, {
          detectChapters,
          includeCover,
          title: title || undefined,
          author: author || undefined,
          onProgress: (stage, current, total) => {
            const label = stage === "extract" ? "Extracting pages" : "Building EPUB";
            setStatus({ kind: "working", stage: label, current, total, fileName: file.name });
          },
        });
        const url = URL.createObjectURL(result.blob);
        setStatus({
          kind: "done",
          url,
          filename: result.filename,
          chapters: result.chapterCount,
          pages: result.pageCount,
          size: result.blob.size,
          hasCover: result.hasCover,
        });
      } catch (e) {
        setStatus({
          kind: "error",
          message: e instanceof Error ? e.message : "Conversion failed",
        });
      }
    },
    [detectChapters, includeCover, title, author],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onPick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const reset = () => {
    if (status.kind === "done") URL.revokeObjectURL(status.url);
    setStatus({ kind: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="min-h-screen font-sans text-stone-800 dark:text-stone-200">
      <header className="bg-paper-500 dark:bg-stone-800/90 border-b border-paper-700/30 dark:border-stone-700 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <BookGlyph className="h-6 w-6 text-stone-900 dark:text-paper-100" />
            <span className="font-serif text-xl font-semibold tracking-tight text-stone-900 dark:text-paper-50 group-hover:text-stone-700 dark:group-hover:text-paper-100 transition">
              pdf-to-epub
            </span>
          </a>
          <nav className="flex items-center gap-5 text-sm">
            <a
              href="#how-it-works"
              className="hidden sm:inline text-stone-800 dark:text-paper-100 hover:text-stone-950 dark:hover:text-white transition"
            >
              How it works
            </a>
            <a
              href="https://github.com/JoshW-dev/pdf-to-epub"
              target="_blank"
              rel="noreferrer"
              className="text-stone-800 dark:text-paper-100 hover:text-stone-950 dark:hover:text-white transition"
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-12 pb-6 md:pt-16 md:pb-10">
        <section className="text-center mb-10">
          <h1 className="font-serif text-4xl md:text-5xl font-semibold text-stone-900 dark:text-paper-50 leading-tight tracking-tight">
            Convert PDFs to EPUBs
          </h1>
          <p className="mt-4 text-stone-700 dark:text-stone-300 text-base md:text-lg max-w-lg mx-auto leading-relaxed">
            Drop in a PDF and get a clean, reflowable EPUB back. Read your books on
            any e-reader, phone, or app — and your file never leaves your device.
          </p>
        </section>

        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-[0_10px_40px_-12px_rgba(110,81,40,0.25)] dark:shadow-2xl ring-1 ring-stone-200 dark:ring-stone-700 p-6 md:p-8 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
                Title
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Auto-detect"
                className="mt-1 w-full rounded-md border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-paper-500 focus:border-paper-500 transition"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
                Author
              </span>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Auto-detect"
                className="mt-1 w-full rounded-md border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-paper-500 focus:border-paper-500 transition"
              />
            </label>
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-start gap-2 text-sm text-stone-700 dark:text-stone-200 cursor-pointer">
              <input
                type="checkbox"
                checked={detectChapters}
                onChange={(e) => setDetectChapters(e.target.checked)}
                className="mt-0.5 rounded border-stone-300 text-paper-600 focus:ring-paper-500"
              />
              <span>Detect chapters (split on "Chapter N", "Prologue", etc.)</span>
            </label>
            <label className="flex items-start gap-2 text-sm text-stone-700 dark:text-stone-200 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCover}
                onChange={(e) => setIncludeCover(e.target.checked)}
                className="mt-0.5 rounded border-stone-300 text-paper-600 focus:ring-paper-500"
              />
              <span>Use the PDF's first page as the cover image</span>
            </label>
          </div>

          {status.kind === "idle" || status.kind === "error" ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl px-6 py-12 text-center cursor-pointer transition ${
                dragOver
                  ? "border-paper-500 bg-paper-50 dark:bg-paper-900/20"
                  : "border-stone-300 dark:border-stone-600 hover:border-paper-500 hover:bg-paper-50/50 dark:hover:bg-paper-900/10"
              }`}
            >
              <div className="flex justify-center mb-3">
                <UploadGlyph className="h-8 w-8 text-paper-600 dark:text-paper-400" />
              </div>
              <p className="text-stone-800 dark:text-stone-100 font-medium">
                Drop a PDF here, or click to choose
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Text-based PDFs only · scanned books need OCR first
              </p>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={onPick}
                className="hidden"
              />
              {status.kind === "error" && (
                <p
                  className="text-rose-700 dark:text-rose-400 text-sm mt-3"
                  role="alert"
                >
                  {status.message}
                </p>
              )}
            </div>
          ) : null}

          {status.kind === "working" && (
            <div className="space-y-2 py-2" role="status">
              <p className="text-sm text-stone-700 dark:text-stone-200 truncate">
                {status.stage}:{" "}
                <span className="font-mono text-xs text-stone-600 dark:text-stone-300">
                  {status.fileName}
                </span>
              </p>
              <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-paper-500 dark:bg-paper-400 transition-all"
                  style={{
                    width: `${Math.round((status.current / Math.max(1, status.total)) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {status.current} / {status.total}
              </p>
            </div>
          )}

          {status.kind === "done" && (
            <div className="space-y-3">
              <div className="rounded-lg bg-paper-50 dark:bg-paper-900/30 ring-1 ring-paper-200 dark:ring-paper-700 p-4">
                <p className="text-sm font-medium text-paper-900 dark:text-paper-100">
                  Done — {status.chapters} chapter{status.chapters === 1 ? "" : "s"}{" "}
                  from {status.pages} page{status.pages === 1 ? "" : "s"}
                  {status.hasCover ? " · cover included" : ""} (
                  {(status.size / 1024).toFixed(1)} KB)
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={status.url}
                  download={status.filename}
                  className="flex-1 inline-flex justify-center items-center rounded-md bg-stone-900 dark:bg-paper-500 px-4 py-2.5 text-sm font-medium text-paper-50 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-paper-400 transition shadow-sm"
                >
                  Download {status.filename}
                </a>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-md px-4 py-2.5 text-sm font-medium text-stone-700 dark:text-stone-200 ring-1 ring-stone-300 dark:ring-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700 transition"
                >
                  Convert another
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-stone-600 dark:text-stone-400 mt-6">
          Files never leave your device · runs entirely in your browser
        </p>
      </main>

      <section
        id="how-it-works"
        className="max-w-3xl mx-auto px-4 pb-16 pt-4"
      >
        <div className="grid sm:grid-cols-3 gap-4 text-center">
          <Step
            n={1}
            title="Drop your PDF"
            body="Pick any text-based PDF — novels, manuals, papers, ebooks."
          />
          <Step
            n={2}
            title="We do the work"
            body="Text extraction, chapter detection, and EPUB packaging happen in your browser."
          />
          <Step
            n={3}
            title="Read anywhere"
            body="Download the EPUB and open it in Books, Kindle, Calibre, or any reader."
          />
        </div>
      </section>

      <footer className="border-t border-stone-200 dark:border-stone-800 mt-4">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-600 dark:text-stone-400">
          <p>PDF.js · JSZip · EPUB 3 · zero server work</p>
          <p>
            Open source on{" "}
            <a
              href="https://github.com/JoshW-dev/pdf-to-epub"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-paper-500 underline-offset-2 hover:text-stone-900 dark:hover:text-paper-100"
            >
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="rounded-lg bg-white/60 dark:bg-stone-800/40 ring-1 ring-stone-200/70 dark:ring-stone-700/70 p-5 backdrop-blur">
      <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-paper-500 text-stone-900 font-serif text-sm font-semibold mb-2">
        {n}
      </div>
      <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-paper-50">
        {title}
      </h3>
      <p className="text-sm text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
        {body}
      </p>
    </div>
  );
}

function BookGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 4.5C4 3.67 4.67 3 5.5 3H19a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5.5A1.5 1.5 0 0 1 4 18.5v-14Z" />
      <path d="M4 17h16" />
      <path d="M8 7h8" />
      <path d="M8 11h6" />
    </svg>
  );
}

function UploadGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 16V4" />
      <path d="m6 10 6-6 6 6" />
      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

export default App;
