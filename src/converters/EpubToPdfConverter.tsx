import { useCallback, useState } from "react";
import type { PdfPageSize } from "../lib/epubToPdf";
import { Dropzone, DoneView, ProgressView } from "./parts";

type Status =
  | { kind: "idle" }
  | { kind: "working"; current: number; total: number; fileName: string }
  | {
      kind: "done";
      url: string;
      filename: string;
      pages: number;
      chapters: number;
      size: number;
    }
  | { kind: "error"; message: string };

const PAGE_SIZES: { value: PdfPageSize; label: string }[] = [
  { value: "a4", label: "A4" },
  { value: "letter", label: "Letter" },
  { value: "a5", label: "A5 (compact)" },
];

export default function EpubToPdfConverter() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pageSize, setPageSize] = useState<PdfPageSize>("a4");

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".epub")) {
        setStatus({ kind: "error", message: "Please choose an .epub file." });
        return;
      }
      setStatus({ kind: "working", current: 0, total: 1, fileName: file.name });
      try {
        const { convertEpubToPdf } = await import("../lib/epubToPdf");
        const result = await convertEpubToPdf(file, {
          pageSize,
          onProgress: (current, total) =>
            setStatus({ kind: "working", current, total, fileName: file.name }),
        });
        const url = URL.createObjectURL(result.blob);
        setStatus({
          kind: "done",
          url,
          filename: result.filename,
          pages: result.pageCount,
          chapters: result.chapterCount,
          size: result.blob.size,
        });
      } catch (e) {
        setStatus({
          kind: "error",
          message: e instanceof Error ? e.message : "Conversion failed",
        });
      }
    },
    [pageSize],
  );

  const reset = () => {
    if (status.kind === "done") URL.revokeObjectURL(status.url);
    setStatus({ kind: "idle" });
  };

  return (
    <div className="space-y-4">
      {(status.kind === "idle" || status.kind === "error") && (
        <>
          <Dropzone
            accept="application/epub+zip,.epub"
            title="Drop an EPUB here, or click to choose"
            hint="Converts instantly, right on your device"
            error={status.kind === "error" ? status.message : undefined}
            onFile={handleFile}
          />

          <details className="group rounded-xl bg-[#fcf7ee] dark:bg-stone-800/50 ring-1 ring-paper-500/15 dark:ring-stone-700 px-5 py-3.5">
            <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-medium text-stone-600 dark:text-stone-300">
              <span>Options — page size</span>
              <span className="ml-4 shrink-0 text-paper-700 dark:text-paper-400 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="mt-4 inline-flex rounded-md ring-1 ring-paper-500/30 dark:ring-stone-600 overflow-hidden">
              {PAGE_SIZES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPageSize(opt.value)}
                  className={`px-4 py-2 text-sm font-medium transition ${
                    pageSize === opt.value
                      ? "bg-stone-900 dark:bg-paper-500 text-paper-50 dark:text-stone-900"
                      : "bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </details>
        </>
      )}

      {status.kind === "working" && (
        <ProgressView
          label={
            status.total > 1
              ? `Laying out chapter ${Math.min(status.current + 1, status.total)} of ${status.total}`
              : "Reading the EPUB"
          }
          current={status.current}
          total={status.total}
          fileName={status.fileName}
        />
      )}

      {status.kind === "done" && (
        <DoneView
          summary={`Done — ${status.pages} page${status.pages === 1 ? "" : "s"} from ${status.chapters} chapter${status.chapters === 1 ? "" : "s"} (${(status.size / 1024).toFixed(1)} KB)`}
          downloadHref={status.url}
          downloadName={status.filename}
          onReset={reset}
        />
      )}
    </div>
  );
}
