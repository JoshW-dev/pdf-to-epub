import { useCallback, useRef, useState } from "react";
import type { ConvertStage } from "../lib/convert";
import { Dropzone, DoneView, ProgressView } from "./parts";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem === 0 ? `${hours} hr` : `${hours} hr ${rem} min`;
}

type Status =
  | { kind: "idle" }
  | { kind: "inspecting"; fileName: string }
  | {
      kind: "scan-confirm";
      file: File;
      fileName: string;
      pageCount: number;
      estimatedSeconds: number;
    }
  | {
      kind: "working";
      stage: ConvertStage;
      label: string;
      current: number;
      total: number;
      fileName: string;
      isOcr: boolean;
    }
  | {
      kind: "done";
      url: string;
      filename: string;
      chapters: number;
      pages: number;
      size: number;
      hasCover: boolean;
      usedOcr: boolean;
    }
  | { kind: "error"; message: string };

export default function PdfToEpubConverter() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [detectChapters, setDetectChapters] = useState(true);
  const [includeCover, setIncludeCover] = useState(true);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const abortRef = useRef<{ aborted: boolean }>({ aborted: false });

  const runConversion = useCallback(
    async (file: File, useOcr: boolean) => {
      abortRef.current = { aborted: false };
      setStatus({
        kind: "working",
        stage: useOcr ? "ocr" : "extract",
        label: useOcr ? "Loading OCR engine" : "Extracting pages",
        current: 0,
        total: 1,
        fileName: file.name,
        isOcr: useOcr,
      });
      try {
        const { convertPdfToEpub } = await import("../lib/convert");
        const result = await convertPdfToEpub(file, {
          detectChapters,
          includeCover,
          useOcr,
          title: title || undefined,
          author: author || undefined,
          abort: abortRef.current,
          onProgress: (stage, current, total) => {
            const label =
              stage === "extract"
                ? "Extracting pages"
                : stage === "ocr"
                  ? "Running OCR"
                  : "Building EPUB";
            setStatus({
              kind: "working",
              stage,
              label,
              current,
              total,
              fileName: file.name,
              isOcr: useOcr,
            });
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
          usedOcr: result.usedOcr,
        });
      } catch (e) {
        if (abortRef.current.aborted) {
          setStatus({ kind: "idle" });
          return;
        }
        setStatus({
          kind: "error",
          message: e instanceof Error ? e.message : "Conversion failed",
        });
      }
    },
    [detectChapters, includeCover, title, author],
  );

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setStatus({ kind: "error", message: "Please choose a .pdf file." });
        return;
      }
      setStatus({ kind: "inspecting", fileName: file.name });
      try {
        const { inspectPdf } = await import("../lib/convert");
        const inspection = await inspectPdf(file);
        if (inspection.isScanned) {
          setStatus({
            kind: "scan-confirm",
            file,
            fileName: file.name,
            pageCount: inspection.pageCount,
            estimatedSeconds: inspection.estimatedOcrSeconds,
          });
          return;
        }
        await runConversion(file, false);
      } catch (e) {
        setStatus({
          kind: "error",
          message: e instanceof Error ? e.message : "Could not read PDF",
        });
      }
    },
    [runConversion],
  );

  const reset = () => {
    if (status.kind === "done") URL.revokeObjectURL(status.url);
    setStatus({ kind: "idle" });
  };

  return (
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
          <span>Detect chapters (split on “Chapter N”, “Prologue”, etc.)</span>
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

      {(status.kind === "idle" || status.kind === "error") && (
        <Dropzone
          accept="application/pdf,.pdf"
          title="Drop a PDF here, or click to choose"
          hint="Text-based PDFs are quick · scanned PDFs are detected automatically and run through OCR"
          error={status.kind === "error" ? status.message : undefined}
          onFile={handleFile}
        />
      )}

      {status.kind === "inspecting" && (
        <div className="rounded-xl bg-paper-50 dark:bg-paper-900/20 ring-1 ring-paper-200 dark:ring-paper-800 p-5 text-center">
          <p className="text-sm text-stone-700 dark:text-stone-200">
            Inspecting <span className="font-mono text-xs">{status.fileName}</span>…
          </p>
        </div>
      )}

      {status.kind === "scan-confirm" && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 ring-1 ring-amber-300 dark:ring-amber-800 p-5">
          <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-paper-50 mb-1">
            This looks like a scanned PDF
          </h3>
          <p className="text-sm text-stone-700 dark:text-stone-200 leading-relaxed">
            There's no embedded text, so we'll need to run OCR to read it. That
            takes much longer than a normal conversion — roughly{" "}
            <strong>{formatDuration(status.estimatedSeconds)}</strong> for{" "}
            {status.pageCount} page{status.pageCount === 1 ? "" : "s"} on a modern
            laptop. The OCR engine (~10 MB) will load on first use. Keep this tab
            open while it runs.
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
            English only. Multi-column layouts and stylized fonts may produce
            imperfect text.
          </p>
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => runConversion(status.file, true)}
              className="flex-1 inline-flex justify-center items-center rounded-md bg-stone-900 dark:bg-paper-500 px-4 py-2.5 text-sm font-medium text-paper-50 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-paper-400 transition shadow-sm"
            >
              Run OCR
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-md px-4 py-2.5 text-sm font-medium text-stone-700 dark:text-stone-200 ring-1 ring-stone-300 dark:ring-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {status.kind === "working" && (
        <ProgressView
          label={
            status.label +
            (status.isOcr && status.stage === "ocr"
              ? ` · page ${status.current} of ${status.total}`
              : "")
          }
          current={status.current}
          total={status.total}
          fileName={status.fileName}
          onCancel={
            status.isOcr ? () => (abortRef.current.aborted = true) : undefined
          }
          footRight={
            status.isOcr && status.stage === "ocr"
              ? `~${formatDuration((status.total - status.current) * 8)} remaining`
              : undefined
          }
        />
      )}

      {status.kind === "done" && (
        <DoneView
          summary={`Done — ${status.chapters} chapter${status.chapters === 1 ? "" : "s"} from ${status.pages} page${status.pages === 1 ? "" : "s"}${status.hasCover ? " · cover included" : ""}${status.usedOcr ? " · via OCR" : ""} (${(status.size / 1024).toFixed(1)} KB)`}
          downloadHref={status.url}
          downloadName={status.filename}
          onReset={reset}
        />
      )}
    </div>
  );
}
