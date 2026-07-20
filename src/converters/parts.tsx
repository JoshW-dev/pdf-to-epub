// Presentational building blocks shared by every converter widget. Keeping the
// drop/progress/result chrome here means each conversion pair only has to
// implement its own engine + options, not re-style the whole flow.

import { useCallback, useRef, useState } from "react";
import { UploadGlyph } from "../components/icons";

export function Dropzone({
  accept,
  title,
  hint,
  error,
  onFile,
}: {
  accept: string;
  title: string;
  hint: string;
  error?: string;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const pick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  const drop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={drop}
      onClick={() => inputRef.current?.click()}
      className={`border border-dashed rounded-2xl px-6 py-14 text-center cursor-pointer transition ${
        dragOver
          ? "border-paper-500 bg-paper-100/60 dark:bg-paper-900/20"
          : "border-paper-500/50 bg-[#fcf7ee]/60 dark:border-stone-600 dark:bg-stone-800/40 hover:border-paper-500 hover:bg-paper-50 dark:hover:bg-paper-900/10"
      }`}
    >
      <div className="flex justify-center mb-4">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-[#ecdcc4] dark:bg-paper-900/40">
          <UploadGlyph className="h-6 w-6 text-paper-800 dark:text-paper-300" />
        </span>
      </div>
      <p className="text-stone-900 dark:text-stone-100 font-semibold">{title}</p>
      <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={pick}
        className="hidden"
      />
      {error && (
        <p className="text-rose-700 dark:text-rose-400 text-sm mt-3" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function ProgressView({
  label,
  current,
  total,
  fileName,
  onCancel,
  footRight,
}: {
  label: string;
  current: number;
  total: number;
  fileName: string;
  onCancel?: () => void;
  footRight?: string;
}) {
  const pct = Math.round((current / Math.max(1, total)) * 100);
  return (
    <div className="space-y-2 py-2" role="status">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm text-stone-700 dark:text-stone-200">
          {label}
        </p>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 text-xs text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-paper-100 underline underline-offset-2"
          >
            Cancel
          </button>
        )}
      </div>
      <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-paper-500 dark:bg-paper-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
        <span className="min-w-0 truncate font-mono">{fileName}</span>
        {footRight && <span className="shrink-0">{footRight}</span>}
      </div>
    </div>
  );
}

export function DoneView({
  summary,
  downloadHref,
  downloadName,
  onReset,
}: {
  summary: string;
  downloadHref: string;
  downloadName: string;
  onReset: () => void;
}) {
  const ext = downloadName.includes(".")
    ? downloadName.slice(downloadName.lastIndexOf(".") + 1).toUpperCase()
    : "file";
  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-paper-50 dark:bg-paper-900/30 ring-1 ring-paper-200 dark:ring-paper-700 p-4">
        <p className="text-sm font-medium text-paper-900 dark:text-paper-100">
          {summary}
        </p>
        <p
          className="mt-1 text-xs text-paper-800/80 dark:text-paper-200/70 truncate"
          title={downloadName}
        >
          {downloadName}
        </p>
      </div>
      <div className="flex gap-2">
        <a
          href={downloadHref}
          download={downloadName}
          className="flex-1 min-w-0 inline-flex justify-center items-center rounded-md bg-stone-900 dark:bg-paper-500 px-4 py-2.5 text-sm font-medium text-paper-50 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-paper-400 transition shadow-sm"
        >
          Download {ext}
        </a>
        <button
          type="button"
          onClick={onReset}
          className="shrink-0 rounded-md px-4 py-2.5 text-sm font-medium text-stone-700 dark:text-stone-200 ring-1 ring-stone-300 dark:ring-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700 transition"
        >
          Convert another
        </button>
      </div>
    </div>
  );
}
