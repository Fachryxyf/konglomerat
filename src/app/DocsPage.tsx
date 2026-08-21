"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, ExternalLink, Github, Play } from "lucide-react";
import BrandMark from "@/components/monopoly/BrandMark";
import LanguageToggle from "@/components/monopoly/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import { chaptersFor } from "@/lib/guide/chapters";
import { useLocale, useT } from "@/lib/i18n";
import { useMounted } from "@/lib/use-mounted";

const REPO_URL = "https://github.com/Fachryxyf/konglomerat";

// Public landing + rulebook. Chapters come from the same source as the in-game
// guide, so docs can never drift from the rules that actually ship.
export default function DocsPage() {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const mounted = useMounted();

  const chapters = chaptersFor(mounted ? locale : "id");
  const [activeId, setActiveId] = useState(chapters[0].id);
  const active = chapters.find((c) => c.id === activeId) ?? chapters[0];

  return (
    <main className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <BrandMark className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold tracking-tight">Konglomerat</span>
          <span className="hidden rounded-full border border-emerald-600/30 px-2 py-0.5 text-[11px] text-emerald-700 sm:inline dark:border-emerald-400/30 dark:text-emerald-300">
            {t("ui.docs.status")}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-6 sm:pt-20">
        <h1 className="max-w-2xl text-4xl font-light tracking-tight sm:text-5xl">{t("ui.docs.tagline")}</h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-[15px] dark:text-zinc-400">
          {t("ui.docs.intro")}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/konglomerat"
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <Play className="h-4 w-4" /> {t("ui.docs.play")}
          </Link>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {t("ui.docs.source")} <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <p className="mt-4 text-xs text-zinc-500">{t("ui.docs.desktopNote")}</p>
      </section>

      <section className="mx-auto max-w-6xl border-t border-zinc-200 px-4 py-10 sm:px-6 dark:border-zinc-800">
        <div className="mb-6 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-bold">{t("ui.docs.rulebook")}</h2>
        </div>

        <div className="flex flex-col gap-8 md:flex-row">
          <nav aria-label={t("ui.docs.contents")} className="md:w-56 md:shrink-0">
            <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-zinc-500">{t("ui.docs.contents")}</p>
            <ul className="flex flex-wrap gap-1 md:flex-col md:gap-0.5">
              {chapters.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(c.id)}
                    aria-current={active.id === c.id ? "true" : undefined}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors ${
                      active.id === c.id
                        ? "bg-emerald-600 text-white"
                        : "text-zinc-600 hover:bg-emerald-50 dark:text-zinc-300 dark:hover:bg-emerald-950/40"
                    }`}
                  >
                    <span className={active.id === c.id ? "text-white" : "text-emerald-600 dark:text-emerald-400"}>
                      {c.icon}
                    </span>
                    <span className="truncate">{c.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <article className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400">{active.icon}</span>
              <h3 className="text-lg font-bold">{active.title}</h3>
            </div>
            {active.body}
          </article>
        </div>
      </section>

      <footer className="border-t border-zinc-200 px-4 py-6 text-center text-xs text-zinc-500 sm:px-6 dark:border-zinc-800">
        © 2026 Fachry Fauzan Syafei · Konglomerat ·{" "}
        <a href={REPO_URL} target="_blank" rel="noreferrer" className="underline hover:text-emerald-600">
          GitHub
        </a>
      </footer>
    </main>
  );
}
