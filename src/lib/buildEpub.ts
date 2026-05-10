import JSZip from "jszip";
import type { Chapter } from "./structure";

export type EpubCover = {
  bytes: ArrayBuffer;
  mediaType: string;
  ext: string;
};

export type EpubOptions = {
  title: string;
  author: string;
  language?: string;
  identifier?: string;
  chapters: Chapter[];
  cover?: EpubCover;
};

export async function buildEpub(opts: EpubOptions): Promise<Blob> {
  const language = opts.language ?? "en";
  const identifier = opts.identifier ?? `urn:uuid:${randomUuid()}`;
  const chapterFiles = opts.chapters.map((_, i) => `chapter-${pad(i + 1)}.xhtml`);

  const zip = new JSZip();

  // mimetype must be the first entry, stored uncompressed.
  zip.file("mimetype", "application/epub+zip", {
    compression: "STORE",
  });

  zip.file("META-INF/container.xml", containerXml());
  zip.file("OEBPS/styles.css", stylesCss());

  opts.chapters.forEach((ch, i) => {
    zip.file(`OEBPS/${chapterFiles[i]}`, chapterXhtml(ch));
  });

  if (opts.cover) {
    zip.file(`OEBPS/cover.${opts.cover.ext}`, opts.cover.bytes);
    zip.file("OEBPS/cover.xhtml", coverXhtml(`cover.${opts.cover.ext}`));
  }

  zip.file(
    "OEBPS/content.opf",
    contentOpf({
      title: opts.title,
      author: opts.author,
      language,
      identifier,
      chapters: opts.chapters,
      chapterFiles,
      cover: opts.cover,
    }),
  );
  zip.file("OEBPS/nav.xhtml", navXhtml(opts.chapters, chapterFiles));
  zip.file("OEBPS/toc.ncx", tocNcx(opts.title, identifier, opts.chapters, chapterFiles));

  return zip.generateAsync({
    type: "blob",
    mimeType: "application/epub+zip",
  });
}

function pad(n: number): string {
  return n.toString().padStart(3, "0");
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function randomUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  const hex = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) out += "-";
    else out += hex[Math.floor(Math.random() * 16)];
  }
  return out;
}

function containerXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
`;
}

function stylesCss(): string {
  return `body { font-family: Georgia, serif; line-height: 1.5; margin: 0 1em; }
h1 { font-size: 1.6em; margin: 1.2em 0 0.8em; text-align: center; page-break-before: always; }
p { margin: 0; text-indent: 1.2em; }
p.first { text-indent: 0; }
`;
}

function chapterXhtml(ch: Chapter): string {
  const body = ch.paragraphs
    .map((p, i) => `    <p${i === 0 ? ' class="first"' : ""}>${escapeHtml(p)}</p>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(ch.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h1>${escapeHtml(ch.title)}</h1>
${body}
</body>
</html>
`;
}

type OpfArgs = {
  title: string;
  author: string;
  language: string;
  identifier: string;
  chapters: Chapter[];
  chapterFiles: string[];
  cover?: EpubCover;
};

function contentOpf(a: OpfArgs): string {
  const manifestItems = a.chapterFiles
    .map(
      (f, i) =>
        `    <item id="ch${pad(i + 1)}" href="${f}" media-type="application/xhtml+xml"/>`,
    )
    .join("\n");
  const spineItems = a.chapterFiles
    .map((_, i) => `    <itemref idref="ch${pad(i + 1)}"/>`)
    .join("\n");
  const coverManifest = a.cover
    ? `    <item id="cover-image" href="cover.${a.cover.ext}" media-type="${a.cover.mediaType}" properties="cover-image"/>
    <item id="cover-page" href="cover.xhtml" media-type="application/xhtml+xml"/>
`
    : "";
  const coverSpine = a.cover ? `    <itemref idref="cover-page" linear="yes"/>\n` : "";
  const coverMetaLegacy = a.cover ? `    <meta name="cover" content="cover-image"/>\n` : "";
  const date = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="${a.language}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${escapeXml(a.identifier)}</dc:identifier>
    <dc:title>${escapeXml(a.title)}</dc:title>
    <dc:creator>${escapeXml(a.author)}</dc:creator>
    <dc:language>${a.language}</dc:language>
    <dc:date>${date}</dc:date>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, "Z")}</meta>
${coverMetaLegacy}  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="styles.css" media-type="text/css"/>
${coverManifest}${manifestItems}
  </manifest>
  <spine toc="ncx">
${coverSpine}${spineItems}
  </spine>
</package>
`;
}

function coverXhtml(href: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Cover</title>
  <style>body { margin: 0; padding: 0; text-align: center; } img { max-width: 100%; height: auto; }</style>
</head>
<body epub:type="cover">
  <img src="${href}" alt="Cover"/>
</body>
</html>
`;
}

function navXhtml(chapters: Chapter[], files: string[]): string {
  const items = chapters
    .map((ch, i) => `      <li><a href="${files[i]}">${escapeHtml(ch.title)}</a></li>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Contents</title>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Contents</h1>
    <ol>
${items}
    </ol>
  </nav>
</body>
</html>
`;
}

function tocNcx(title: string, identifier: string, chapters: Chapter[], files: string[]): string {
  const navPoints = chapters
    .map(
      (ch, i) => `    <navPoint id="navPoint-${i + 1}" playOrder="${i + 1}">
      <navLabel><text>${escapeXml(ch.title)}</text></navLabel>
      <content src="${files[i]}"/>
    </navPoint>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${escapeXml(identifier)}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(title)}</text></docTitle>
  <navMap>
${navPoints}
  </navMap>
</ncx>
`;
}
