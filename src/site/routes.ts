// Maps a URL path to the config + interactive widget for that conversion page.
// Adding a new converter is just another entry here.

import type { ComponentType } from "react";
import { epubToPdfConfig, pdfToEpubConfig, type ConversionConfig } from "./config";
import PdfToEpubConverter from "../converters/PdfToEpubConverter";
import EpubToPdfConverter from "../converters/EpubToPdfConverter";

export type Route = { config: ConversionConfig; Widget: ComponentType };

export const ROUTES: Route[] = [
  { config: pdfToEpubConfig, Widget: PdfToEpubConverter },
  { config: epubToPdfConfig, Widget: EpubToPdfConverter },
];

function normalize(pathname: string): string {
  if (!pathname || pathname === "/index.html") return "/";
  const stripped = pathname.replace(/\/+$/, "");
  return stripped === "" ? "/" : stripped;
}

/** Resolve a pathname to a route, defaulting to the home (PDF→EPUB) page. */
export function resolveRoute(pathname: string): Route {
  const path = normalize(pathname);
  return ROUTES.find((r) => r.config.path === path) ?? ROUTES[0];
}
