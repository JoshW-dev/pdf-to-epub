export type Chapter = {
  title: string;
  paragraphs: string[];
};

const FRONT_RE = /^(prologue|epilogue|introduction|foreword|preface|afterword|acknowledgments)\b.*$/i;
// Compact form: spaces/hyphens stripped, lowercased.
const CHAPTER_PREFIX_RE = /^chapter(\d{1,3}|[ivxlcdm]{1,8}|[a-z]+)$/;
const ORDINAL_WORD_RE =
  /^(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty(?:one|two|three|four|five|six|seven|eight|nine)?|thirty(?:one|two|three|four|five|six|seven|eight|nine)?|forty(?:one|two|three|four|five|six|seven|eight|nine)?|fifty(?:one|two|three|four|five|six|seven|eight|nine)?)$/;

function isChapterHeading(rawLine: string): boolean {
  const trimmed = rawLine.trim();
  if (trimmed.length === 0 || trimmed.length > 80) return false;
  if (FRONT_RE.test(trimmed)) return true;
  const compact = trimmed.replace(/[\s\-_·•.,]+/g, "").toLowerCase();
  if (CHAPTER_PREFIX_RE.test(compact)) return true;
  if (ORDINAL_WORD_RE.test(compact)) return true;
  return false;
}

export function buildChapters(pages: string[], detect: boolean): Chapter[] {
  const allLines: string[] = [];
  for (const page of pages) {
    for (const line of page.split("\n")) allLines.push(line);
    allLines.push(""); // page break => paragraph break
  }

  if (!detect) {
    return [{ title: "Book", paragraphs: linesToParagraphs(allLines) }];
  }

  const chapters: Chapter[] = [];
  let buffer: string[] = [];
  let currentTitle: string | null = null;

  const flush = () => {
    const paragraphs = linesToParagraphs(buffer);
    if (paragraphs.length === 0 && !currentTitle) return;
    chapters.push({
      title: currentTitle ?? "Front Matter",
      paragraphs,
    });
    buffer = [];
  };

  for (const line of allLines) {
    if (isChapterHeading(line)) {
      flush();
      currentTitle = formatHeading(line.trim());
      continue;
    }
    buffer.push(line);
  }
  flush();

  if (chapters.length === 0) {
    return [{ title: "Book", paragraphs: linesToParagraphs(allLines) }];
  }
  return chapters;
}

function linesToParagraphs(lines: string[]): string[] {
  const paragraphs: string[] = [];
  let current: string[] = [];
  const push = () => {
    if (current.length) {
      const text = current.join(" ").replace(/\s+/g, " ").trim();
      if (text) paragraphs.push(text);
      current = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      push();
      continue;
    }
    // Page-number-only line: skip
    if (/^\d{1,4}$/.test(line)) continue;
    current.push(line);
    // End-of-paragraph heuristic: line ends with sentence terminator and is short
    if (/[.!?"'”’]$/.test(line) && line.length < 60) {
      // don't auto-break — let blank lines do that. keep simple.
    }
  }
  push();
  return paragraphs;
}

function formatHeading(s: string): string {
  // Collapse stylized inter-letter spacing ("T w o" → "Two"), then title-case.
  const compact = s.replace(/\s+/g, "");
  const looksLikeSpacedLetters = compact.length > 0 && compact.length <= 20 && s.length > compact.length * 1.5;
  const base = looksLikeSpacedLetters ? compact : s;
  return base
    .toLowerCase()
    .replace(/\b([a-z])/g, (_, c: string) => c.toUpperCase())
    .replace(/\bIii\b/g, "III")
    .replace(/\bIi\b/g, "II")
    .replace(/\bIv\b/g, "IV");
}
