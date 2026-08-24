// The one illustration on a converter page: source format, arrow, result.
//
// A PDF is drawn as a fixed page with a folded corner and tightly-set lines that
// stop where the page stops; an EPUB is drawn on an e-reader with fewer, wider-set
// lines, so the pair reads as "locked page in, text that reflows out". Both panels
// are built inside the same 140-wide slot, which lets the two pages swap sides just
// by swapping the x offsets — /epub-to-pdf gets the e-reader on the left for free.

type PanelProps = { x: number };

const LINE = "fill-paper-500/35 dark:fill-stone-600";
const HEADING_LINE = "fill-paper-700/40 dark:fill-stone-500";
const EDGE = "stroke-paper-500/50 dark:stroke-stone-600";
const LABEL = "font-serif text-[13px] tracking-[0.16em] fill-stone-500 dark:fill-stone-400";

function PdfPanel({ x }: PanelProps) {
  return (
    <g transform={`translate(${x} 0)`}>
      <path
        d="M18 18a6 6 0 0 1 6-6h74l24 24v104a6 6 0 0 1-6 6H24a6 6 0 0 1-6-6z"
        className={`fill-[#fffdf8] dark:fill-stone-800 ${EDGE}`}
        strokeWidth="2"
      />
      {/* the dog-ear, which is the fastest way to read a shape as "a page" */}
      <path d="M98 12v18a6 6 0 0 0 6 6h18" fill="none" className={EDGE} strokeWidth="2" />

      <rect x="30" y="46" width="44" height="6" rx="2" className={HEADING_LINE} />
      {[62, 74, 86, 98, 110].map((y) => (
        <rect key={y} x="30" y={y} width="80" height="4" rx="2" className={LINE} />
      ))}
      <rect x="30" y="122" width="50" height="4" rx="2" className={LINE} />

      <text x="70" y="172" textAnchor="middle" className={LABEL}>
        PDF
      </text>
    </g>
  );
}

function EpubPanel({ x }: PanelProps) {
  return (
    <g transform={`translate(${x} 0)`}>
      <rect
        x="10"
        y="8"
        width="120"
        height="142"
        rx="14"
        className={`fill-[#efe3d1] dark:fill-stone-800 ${EDGE}`}
        strokeWidth="2"
      />
      <rect
        x="21"
        y="19"
        width="98"
        height="104"
        rx="5"
        className="fill-[#fffdf8] dark:fill-stone-900"
      />

      <rect x="31" y="32" width="40" height="6" rx="2" className={HEADING_LINE} />
      {[50, 64, 78, 92].map((y) => (
        <rect key={y} x="31" y={y} width="78" height="4" rx="2" className={LINE} />
      ))}
      <rect x="31" y="106" width="46" height="4" rx="2" className={LINE} />

      <circle cx="70" cy="136" r="5.5" fill="none" className={EDGE} strokeWidth="2" />

      <text x="70" y="172" textAnchor="middle" className={LABEL}>
        EPUB
      </text>
    </g>
  );
}

/** Renders whichever panel matches a config's `fromFormat` / `toFormat`. */
function Panel({ format, x }: { format: string; x: number }) {
  return format.toUpperCase() === "PDF" ? <PdfPanel x={x} /> : <EpubPanel x={x} />;
}

export default function FormatFlow({
  from,
  to,
  className,
}: {
  from: string;
  to: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 184"
      fill="none"
      role="img"
      aria-label={`${from} converting to ${to}, shown as two panels with an arrow between them`}
      className={className}
    >
      <Panel format={from} x={0} />

      <g
        className="stroke-paper-700 dark:stroke-paper-400"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M174 78h50" />
        <path d="m216 70 8 8-8 8" />
      </g>

      <Panel format={to} x={260} />
    </svg>
  );
}
