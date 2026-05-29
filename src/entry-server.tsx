// SSR/SSG entry. The prerender script imports `render` for each route to bake
// static HTML + a fully-populated <head> into the built pages. This is a build
// entry point, not a hot-reloaded component module.
/* eslint-disable react-refresh/only-export-components */

import { renderToString } from "react-dom/server";
import ConverterPage from "./components/ConverterPage";
import { buildHead } from "./site/buildHead";
import { resolveRoute, ROUTES } from "./site/routes";

export function render(url: string): { html: string; head: string } {
  const route = resolveRoute(url);
  const html = renderToString(
    <ConverterPage config={route.config} Widget={route.Widget} />,
  );
  return { html, head: buildHead(route.config) };
}

export { ROUTES };
export {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  GITHUB_URL,
  canonicalUrl,
} from "./site/config";
