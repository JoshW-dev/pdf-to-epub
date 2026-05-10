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
    <div className="min-h-full bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <header className="text-center mb-6">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">
            PDF → EPUB
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Runs entirely in your browser. Files never leave your device.
          </p>
        </header>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg ring-1 ring-slate-200 dark:ring-slate-700 p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Title (optional)
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Auto-detect"
                className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Author (optional)
              </span>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Auto-detect"
                className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={detectChapters}
                onChange={(e) => setDetectChapters(e.target.checked)}
                className="rounded border-slate-300"
              />
              Detect chapters (split on "Chapter N", "Prologue", etc.)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={includeCover}
                onChange={(e) => setIncludeCover(e.target.checked)}
                className="rounded border-slate-300"
              />
              Use the PDF's first page as the cover image
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
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                  : "border-slate-300 dark:border-slate-600 hover:border-indigo-400"
              }`}
            >
              <p className="text-slate-700 dark:text-slate-200 font-medium">
                Drop a PDF here, or click to choose
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Text-based PDFs only (scanned books need OCR)
              </p>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={onPick}
                className="hidden"
              />
              {status.kind === "error" && (
                <p className="text-rose-600 dark:text-rose-400 text-sm mt-3" role="alert">
                  {status.message}
                </p>
              )}
            </div>
          ) : null}

          {status.kind === "working" && (
            <div className="space-y-2" role="status">
              <p className="text-sm text-slate-700 dark:text-slate-200 truncate">
                {status.stage}: <span className="font-mono">{status.fileName}</span>
              </p>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all"
                  style={{
                    width: `${Math.round((status.current / Math.max(1, status.total)) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {status.current} / {status.total}
              </p>
            </div>
          )}

          {status.kind === "done" && (
            <div className="space-y-3">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-200 dark:ring-emerald-900 p-4">
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                  Done — {status.chapters} chapter{status.chapters === 1 ? "" : "s"} from{" "}
                  {status.pages} page{status.pages === 1 ? "" : "s"}
                  {status.hasCover ? " · cover included" : ""} (
                  {(status.size / 1024).toFixed(1)} KB)
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={status.url}
                  download={status.filename}
                  className="flex-1 inline-flex justify-center items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"
                >
                  Download {status.filename}
                </a>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 ring-1 ring-slate-300 dark:ring-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  Convert another
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          PDF.js extracts text · JSZip packages EPUB 3 · zero server work
        </p>
      </div>
    </div>
  );
}

export default App;
