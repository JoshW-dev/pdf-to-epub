import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./index.css";
import ConverterPage from "./components/ConverterPage";
import { resolveRoute } from "./site/routes";

const route = resolveRoute(window.location.pathname);

// Ensure title/description are set even in dev, where there's no prerendered head.
// In production these already match the prerendered <head>, so this is a no-op.
document.title = route.config.title;
let desc = document.querySelector('meta[name="description"]');
if (!desc) {
  desc = document.createElement("meta");
  desc.setAttribute("name", "description");
  document.head.appendChild(desc);
}
desc.setAttribute("content", route.config.metaDescription);

const rootEl = document.getElementById("root")!;
const app = (
  <StrictMode>
    <ConverterPage config={route.config} Widget={route.Widget} />
  </StrictMode>
);

// Hydrate the prerendered markup in production; in dev (no SSR output, just the
// placeholder comment) do a fresh client render to avoid a hydration mismatch.
if (rootEl.firstElementChild) {
  hydrateRoot(rootEl, app);
} else {
  createRoot(rootEl).render(app);
}
