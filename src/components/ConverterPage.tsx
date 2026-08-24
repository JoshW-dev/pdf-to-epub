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
import { ArrowGlyph, BookGlyph, CheckGlyph, LockGlyph } from "./icons";
import FormatFlow from "./FormatFlow";

// Segmented control that swaps conversion direction. Each segment is a real link
// to that converter's page, so the two-page SEO architecture is preserved — the
// toggle is just a prettier way to move between them.
function DirectionToggle({ current }: { current: string }) {
  return (
    <div className="inline-flex rounded-lg bg-[#efe3d1] dark:bg-stone-800 p-1">
      {ALL_CONFIGS.map((c) => {
        const active = c.path === current;
        return (
          <a
            key={c.path}
            href={c.path}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-paper-50 shadow-sm"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            }`}
          >
            {c.fromFormat} → {c.toFormat}
          </a>
        );
      })}
    </div>
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
      <header>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <a href="/" className="flex shrink-0 items-center gap-2.5 group">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#ecdcc4] dark:bg-stone-800">
              <BookGlyph className="h-5 w-5 text-paper-800 dark:text-paper-300" />
            </span>
            <span className="font-serif text-xl font-semibold tracking-tight text-stone-900 dark:text-paper-50 group-hover:text-stone-700 dark:group-hover:text-paper-100 transition">
              {SITE_NAME}
            </span>
          </a>
          <nav className="flex items-center gap-5 sm:gap-6 text-sm whitespace-nowrap">
            <a
              href="#how-to"
              className="text-stone-600 dark:text-paper-100 hover:text-stone-900 dark:hover:text-white transition"
            >
              How it works
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="text-stone-600 dark:text-paper-100 hover:text-stone-900 dark:hover:text-white transition"
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero + tool, above the fold */}
        <section className="max-w-2xl mx-auto px-4 pt-10 pb-6 md:pt-16 md:pb-8">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#f0e5d3] dark:bg-stone-800 px-3.5 py-1.5 text-xs font-medium text-paper-800 dark:text-paper-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              100% private · runs in your browser
            </span>
            <h1 className="mt-5 font-serif text-4xl md:text-5xl font-semibold text-stone-900 dark:text-paper-50 leading-[1.1] tracking-tight">
              {config.h1}
            </h1>
            <p className="mt-5 text-stone-600 dark:text-stone-300 text-lg max-w-lg mx-auto leading-relaxed">
              {config.introLead}
            </p>
            <p className="mt-3 text-stone-500 dark:text-stone-400 text-base max-w-lg mx-auto leading-relaxed">
              {config.introBody}
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <DirectionToggle current={config.path} />
          </div>

          <Widget />

          <p className="flex items-center justify-center gap-2 text-center text-xs text-stone-500 dark:text-stone-400 mt-6">
            <LockGlyph className="h-3.5 w-3.5 shrink-0" />
            {config.trustLine}
          </p>
        </section>

        {/* How it works */}
        <section id="how-to" className="max-w-3xl mx-auto px-4 py-12 scroll-mt-20">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-stone-900 dark:text-paper-50 text-center mb-6">
            {config.howToHeading}
          </h2>
          <FormatFlow
            from={config.fromFormat}
            to={config.toFormat}
            className="mx-auto mb-8 w-full max-w-sm sm:max-w-md h-auto"
          />
          <div className="grid sm:grid-cols-3 gap-4">
            {config.steps.map((step, i) => (
              <div
                key={i}
                className="rounded-xl bg-[#fcf7ee] dark:bg-stone-800/40 ring-1 ring-paper-500/15 dark:ring-stone-700/70 p-5"
              >
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#ecdcc4] dark:bg-stone-700 text-paper-800 dark:text-paper-300 font-serif text-sm font-semibold mb-3">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-stone-900 dark:text-paper-50">
                  {step.title}
                </h3>
                <p className="text-sm text-stone-500 dark:text-stone-300 mt-1.5 leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="max-w-4xl mx-auto px-4 py-12">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-stone-900 dark:text-paper-50 text-center mb-8">
            {config.featuresHeading}
          </h2>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
            {config.features.map((feature, i) => (
              <div key={i} className="flex gap-3">
                <CheckGlyph className="h-5 w-5 mt-0.5 shrink-0 text-paper-700 dark:text-paper-400" />
                <div>
                  <h3 className="font-semibold text-stone-900 dark:text-paper-50">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-stone-500 dark:text-stone-300 mt-0.5 leading-relaxed">
                    {feature.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Long-form explainer */}
        <section className="max-w-2xl mx-auto px-4 py-12">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-stone-900 dark:text-paper-50 mb-5">
            {config.aboutHeading}
          </h2>
          <div className="space-y-4">
            {config.aboutParas.map((para, i) => (
              <p
                key={i}
                className="text-stone-600 dark:text-stone-300 leading-relaxed"
              >
                {para}
              </p>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 py-12">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-stone-900 dark:text-paper-50 text-center mb-8">
            {config.faqHeading}
          </h2>
          <div className="space-y-3">
            {config.faqs.map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl bg-[#fcf7ee] dark:bg-stone-800/50 ring-1 ring-paper-500/15 dark:ring-stone-700 px-5 py-4"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-stone-900 dark:text-paper-50">
                  <span>{faq.q}</span>
                  <span className="ml-4 shrink-0 text-paper-700 dark:text-paper-400 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Internal links to sibling converters */}
        <section className="max-w-3xl mx-auto px-4 py-12">
          <h2 className="font-serif text-xl font-semibold text-stone-900 dark:text-paper-50 mb-4">
            More converters
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {config.related.map((link) => (
              <a
                key={link.path}
                href={link.path}
                className="group flex items-start gap-3 rounded-xl bg-[#fcf7ee] dark:bg-stone-800/50 ring-1 ring-paper-500/15 dark:ring-stone-700 px-5 py-4 hover:ring-paper-500 dark:hover:ring-paper-500 transition"
              >
                <ArrowGlyph className="h-5 w-5 mt-0.5 shrink-0 text-paper-700 dark:text-paper-400 group-hover:translate-x-0.5 transition-transform" />
                <span>
                  <span className="block font-semibold text-stone-900 dark:text-paper-50">
                    {link.label}
                  </span>
                  <span className="block text-sm text-stone-500 dark:text-stone-300 mt-0.5">
                    {link.blurb}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-paper-500/15 dark:border-stone-800 mt-4">
        <div className="max-w-5xl mx-auto px-6 py-8 text-center text-xs text-stone-500 dark:text-stone-400">
          <p>
            Runs entirely in your browser ·{" "}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="text-paper-700 dark:text-paper-400 hover:text-paper-800 dark:hover:text-paper-300 transition"
            >
              Open source
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
