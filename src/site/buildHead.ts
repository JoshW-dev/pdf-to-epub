// Builds the per-route <head> SEO markup as a plain string.
//
// Used by the SSR entry (entry-server) so every prerendered route ships with a
// correct <title>, meta description, canonical, Open Graph / Twitter cards, and
// JSON-LD structured data baked into the HTML — no JavaScript required for a
// crawler to read it. Because the structured data is generated from the same
// config that renders the visible copy, the FAQ/HowTo schema always matches what
// the user actually sees (a Google requirement).

import {
  canonicalUrl,
  OG_IMAGE_PATH,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  type ConversionConfig,
} from "./config";

/** Escape a string for use inside an HTML attribute value. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Serialize a JSON-LD object into a safe <script> tag. */
function jsonLd(data: unknown): string {
  // Escape "<" so a "</script>" sequence in any string can't break out of the tag.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}

function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description: SITE_TAGLINE,
  };
}

function appSchema(config: ConversionConfig) {
  const url = canonicalUrl(config);
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: config.h1,
    url,
    description: config.metaDescription,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires a modern web browser with JavaScript.",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: config.features.map((f) => f.title),
    publisher: { "@type": "Organization", name: SITE_NAME, url: `${SITE_URL}/` },
  };
}

function faqSchema(config: ConversionConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: config.faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

function howToSchema(config: ConversionConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: config.howToHeading,
    description: `Steps to convert ${config.fromFormat} to ${config.toFormat} for free in your browser.`,
    totalTime: "PT1M",
    step: config.steps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.title,
      text: step.body,
    })),
  };
}

function breadcrumbSchema(config: ConversionConfig) {
  const items: Array<{ name: string; url: string }> = [
    { name: "Home", url: `${SITE_URL}/` },
  ];
  if (config.path !== "/") {
    items.push({ name: config.h1, url: canonicalUrl(config) });
  }
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** The full inner-<head> SEO markup for a route, as an HTML string. */
export function buildHead(config: ConversionConfig): string {
  const url = canonicalUrl(config);
  const ogImage = `${SITE_URL}${OG_IMAGE_PATH}`;
  const isHome = config.path === "/";

  const schemas: unknown[] = [
    appSchema(config),
    howToSchema(config),
    faqSchema(config),
    breadcrumbSchema(config),
  ];
  if (isHome) schemas.unshift(webSiteSchema());

  return [
    `<title>${esc(config.title)}</title>`,
    `<meta name="description" content="${esc(config.metaDescription)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large" />`,
    `<meta name="application-name" content="${esc(SITE_NAME)}" />`,
    `<meta name="theme-color" content="#d4a574" />`,

    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta property="og:title" content="${esc(config.title)}" />`,
    `<meta property="og:description" content="${esc(config.metaDescription)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(ogImage)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,

    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(config.title)}" />`,
    `<meta name="twitter:description" content="${esc(config.metaDescription)}" />`,
    `<meta name="twitter:image" content="${esc(ogImage)}" />`,

    ...schemas.map(jsonLd),
  ].join("\n    ");
}
