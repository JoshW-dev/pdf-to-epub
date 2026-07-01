# Graph Report - pdf-to-epub  (2026-05-30)

## Corpus Check
- 27 files · ~24,034 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 218 nodes · 308 edges · 18 communities (17 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `10d20075`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 17 edges
2. `compilerOptions` - 16 edges
3. `buildEpub()` - 10 edges
4. `convertPdfToEpub()` - 10 edges
5. `buildHead()` - 10 edges
6. `scripts` - 8 edges
7. `parseEpub()` - 7 edges
8. `convertEpubToPdf()` - 7 edges
9. `buildChapters()` - 6 edges
10. `canonicalUrl()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `convertPdfToEpub()` --calls--> `buildEpub()`  [EXTRACTED]
  src/lib/convert.ts → src/lib/buildEpub.ts
- `convertPdfToEpub()` --calls--> `buildChapters()`  [EXTRACTED]
  src/lib/convert.ts → src/lib/structure.ts
- `render()` --calls--> `buildHead()`  [EXTRACTED]
  src/entry-server.tsx → src/site/buildHead.ts
- `render()` --calls--> `resolveRoute()`  [EXTRACTED]
  src/entry-server.tsx → src/site/routes.ts
- `convertPdfToEpub()` --calls--> `openPdf()`  [EXTRACTED]
  src/lib/convert.ts → src/lib/pdfExtract.ts

## Import Cycles
- None detected.

## Communities (18 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.13
Nodes (22): appSchema(), breadcrumbSchema(), buildHead(), esc(), faqSchema(), howToSchema(), webSiteSchema(), canonicalUrl() (+14 more)

### Community 1 - "Community 1"
Cohesion: 0.18
Nodes (21): ConvertOptions, convertPdfToEpub(), ConvertResult, inspectPdf(), InspectResult, prettifyFilename(), sanitize(), looksScanned() (+13 more)

### Community 2 - "Community 2"
Cohesion: 0.15
Nodes (19): buildEpub(), chapterXhtml(), containerXml(), contentOpf(), coverXhtml(), EpubCover, EpubOptions, escapeHtml() (+11 more)

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (17): Block, convertEpubToPdf(), dirname(), EpubManifest, EpubToPdfOptions, EpubToPdfResult, extractBlocks(), findEntry() (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (19): dependencies, jspdf, jszip, pdfjs-dist, react, react-dom, tesseract.js, name (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (16): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, postcss (+8 more)

### Community 8 - "Community 8"
Cohesion: 0.24
Nodes (9): PAGE_SIZES, Status, DoneView(), Dropzone(), ProgressView(), formatDuration(), PdfToEpubConverter(), Status (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.27
Nodes (6): ArrowGlyph(), BookGlyph(), CheckGlyph(), IconProps, UploadGlyph(), ALL_CONFIGS

### Community 10 - "Community 10"
Cohesion: 0.25
Nodes (7): Adding a new converter, Architecture: one template, many pages, Convert2EPUB, How it works, Limitations, Local development, Production build

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (5): dist, entries, llms, root, template

### Community 12 - "Community 12"
Cohesion: 0.40
Nodes (4): cleanUrls, redirects, $schema, trailingSlash

## Knowledge Gaps
- **105 isolated node(s):** `tsBuildInfoFile`, `target`, `lib`, `module`, `types` (+100 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Community 7` to `Community 4`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `buildEpub()` connect `Community 2` to `Community 1`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `tsBuildInfoFile`, `target`, `lib` to the rest of the system?**
  _105 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1349206349206349 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._