// Static-site generation step. Runs after the client and SSR builds:
//   1. read the built dist/index.html as a template (Vite has already injected
//      the hashed JS/CSS asset tags),
//   2. render each route to HTML + a populated <head> via the SSR bundle,
//   3. write a static index.html per route,
//   4. emit sitemap.xml.
//
// The result: every URL serves crawlable HTML with correct SEO tags, then
// hydrates into the live React converter.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, "dist");

const template = fs.readFileSync(path.join(dist, "index.html"), "utf-8");

if (!template.includes("<!--app-html-->") || !template.includes("<!--app-head-->")) {
  throw new Error(
    "Template is missing the <!--app-html--> / <!--app-head--> placeholders — " +
      "Vite may have stripped the HTML comments during build.",
  );
}

const { render, ROUTES, SITE_URL, canonicalUrl } = await import(
  "./dist-ssr/entry-server.js"
);

for (const { config } of ROUTES) {
  const { html, head } = render(config.path);
  const page = template
    .replace("<!--app-head-->", head)
    .replace("<!--app-html-->", html);

  const outPath =
    config.path === "/"
      ? path.join(dist, "index.html")
      : path.join(dist, config.path.replace(/^\//, ""), "index.html");

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, page);
  console.log(`prerendered ${config.path} -> ${path.relative(root, outPath)}`);
}

// sitemap.xml
const entries = ROUTES.map(({ config }) => {
  const loc = canonicalUrl(config);
  const priority = config.path === "/" ? "1.0" : "0.8";
  return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}).join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
fs.writeFileSync(path.join(dist, "sitemap.xml"), sitemap);
console.log(`wrote sitemap.xml (${ROUTES.length} urls) for ${SITE_URL}`);
