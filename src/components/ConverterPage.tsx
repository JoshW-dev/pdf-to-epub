// The one template every conversion page renders from. It receives a pure-data
// ConversionConfig (copy, FAQ, steps, links) plus the interactive widget for that
// pair, and lays out the full SEO page: keyworded H1, intro, the tool, a how-to,
// benefits, a long-form explainer, FAQ accordions, and internal links.

import type { ComponentType } from "react";
import {
  GITHUB_URL,
  SITE_NAME,
  ALL_CONFIGS,
  type ConversionConfig,
} from "../site/config";
import { ArrowGlyph, BookGlyph, CheckGlyph } from "./icons";

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      className={`transition ${
        active
          ? "text-stone-950 dark:text-white font-medium"
          : "text-stone-800 dark:text-paper-100 hover:text-stone-950 dark:hover:text-white"
      }`}
    >
      {children}
    </a>
  );
}

export default function ConverterPage({
  config,
  Widget,
}: {
  config: ConversionConfig;
  Widget: ComponentType;
}) {
  return (
    <div className="min-h-screen font-sans text-stone-800 dark:text-stone-200">
      <header className="bg-paper-500 dark:bg-stone-800/90 border-b border-paper-700/30 dark:border-stone-700 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <a href="/" className="flex shrink-0 items-center gap-2 group">
            <BookGlyph className="h-6 w-6 text-stone-900 dark:text-paper-100" />
            <span className="font-serif text-xl font-semibold tracking-tight text-stone-900 dark:text-paper-50 group-hover:text-stone-700 dark:group-hover:text-paper-100 transition">
              {SITE_NAME}
            </span>
          </a>
          <nav className="flex items-center gap-4 sm:gap-5 text-sm whitespace-nowrap">
            <NavLink href="/" active={config.path === "/"}>
              PDF to EPUB
            </NavLink>
            <NavLink href="/epub-to-pdf" active={config.path === "/epub-to-pdf"}>
              EPUB to PDF
            </NavLink>
            <a
              href="#how-to"
              className="hidden sm:inline text-stone-800 dark:text-paper-100 hover:text-stone-950 dark:hover:text-white transition"
            >
              How it works
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline text-stone-800 dark:text-paper-100 hover:text-stone-950 dark:hover:text-white transition"
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero + tool, above the fold */}
        <section className="max-w-2xl mx-auto px-4 pt-12 pb-6 md:pt-16 md:pb-8">
          <div className="text-center mb-8">
            <h1 className="font-serif text-4xl md:text-5xl font-semibold text-stone-900 dark:text-paper-50 leading-tight tracking-tight">
              {config.h1}
            </h1>
            <p className="mt-4 text-stone-800 dark:text-stone-200 text-lg font-medium max-w-lg mx-auto">
              {config.introLead}
            </p>
            <p className="mt-3 text-stone-700 dark:text-stone-300 text-base max-w-lg mx-auto leading-relaxed">
              {config.introBody}
            </p>
          </div>

          <Widget />

          <p className="text-center text-xs text-stone-600 dark:text-stone-400 mt-6">
            {config.trustLine}
          </p>
        </section>

        {/* How it works */}
        <section id="how-to" className="max-w-3xl mx-auto px-4 py-10 scroll-mt-20">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-stone-900 dark:text-paper-50 text-center mb-8">
            {config.howToHeading}
          </h2>
          <div className="grid sm:grid-cols-3 gap-4 text-center">
            {config.steps.map((step, i) => (
              <div
                key={i}
                className="rounded-lg bg-white/60 dark:bg-stone-800/40 ring-1 ring-stone-200/70 dark:ring-stone-700/70 p-5 backdrop-blur"
              >
                <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-paper-500 text-stone-900 font-serif text-sm font-semibold mb-2">
                  {i + 1}
                </div>
                <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-paper-50">
                  {step.title}
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="max-w-4xl mx-auto px-4 py-10">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-stone-900 dark:text-paper-50 text-center mb-8">
            {config.featuresHeading}
          </h2>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
            {config.features.map((feature, i) => (
              <div key={i} className="flex gap-3">
                <CheckGlyph className="h-5 w-5 mt-0.5 shrink-0 text-paper-600 dark:text-paper-400" />
                <div>
                  <h3 className="font-semibold text-stone-900 dark:text-paper-50">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-300 mt-0.5 leading-relaxed">
                    {feature.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Long-form explainer */}
        <section className="max-w-2xl mx-auto px-4 py-10">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-stone-900 dark:text-paper-50 mb-5">
            {config.aboutHeading}
          </h2>
          <div className="space-y-4">
            {config.aboutParas.map((para, i) => (
              <p
                key={i}
                className="text-stone-700 dark:text-stone-300 leading-relaxed"
              >
                {para}
              </p>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 py-10">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-stone-900 dark:text-paper-50 text-center mb-8">
            {config.faqHeading}
          </h2>
          <div className="space-y-3">
            {config.faqs.map((faq, i) => (
              <details
                key={i}
                className="group rounded-lg bg-white/70 dark:bg-stone-800/50 ring-1 ring-stone-200 dark:ring-stone-700 px-5 py-4"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-stone-900 dark:text-paper-50">
                  <span>{faq.q}</span>
                  <span className="ml-4 shrink-0 text-paper-600 dark:text-paper-400 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Internal links to sibling converters */}
        <section className="max-w-3xl mx-auto px-4 py-10">
          <h2 className="font-serif text-xl font-semibold text-stone-900 dark:text-paper-50 mb-4">
            More converters
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {config.related.map((link) => (
              <a
                key={link.path}
                href={link.path}
                className="group flex items-start gap-3 rounded-lg bg-white/70 dark:bg-stone-800/50 ring-1 ring-stone-200 dark:ring-stone-700 px-5 py-4 hover:ring-paper-500 dark:hover:ring-paper-500 transition"
              >
                <ArrowGlyph className="h-5 w-5 mt-0.5 shrink-0 text-paper-600 dark:text-paper-400 group-hover:translate-x-0.5 transition-transform" />
                <span>
                  <span className="block font-semibold text-stone-900 dark:text-paper-50">
                    {link.label}
                  </span>
                  <span className="block text-sm text-stone-600 dark:text-stone-300 mt-0.5">
                    {link.blurb}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 dark:border-stone-800 mt-4">
        <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600 dark:text-stone-400">
          <nav className="flex items-center gap-4">
            {ALL_CONFIGS.map((c) => (
              <a
                key={c.path}
                href={c.path}
                className="hover:text-stone-900 dark:hover:text-paper-100 transition"
              >
                {c.h1.replace(" Converter", "")}
              </a>
            ))}
          </nav>
          <p>
            Runs entirely in your browser ·{" "}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-paper-500 underline-offset-2 hover:text-stone-900 dark:hover:text-paper-100"
            >
              Open source
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
