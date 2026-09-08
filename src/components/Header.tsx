"use client";

import { LanguageToggle } from "@/components/LanguageToggle";
import { t } from "@/lib/copy";
import type { Daypart, Locale } from "@/types";
import { BookOpen, ClipboardList, Maximize2, Minimize2, ScanFace } from "lucide-react";
import Link from "next/link";

type Props = {
  locale: Locale;
  daypart?: Daypart;
  clock?: string;
  compact?: boolean;
  docsActive?: boolean;
  careActive?: boolean;
  fullscreen?: boolean;
  onLocale: (locale: Locale) => void;
  onFullscreen?: () => void;
};

function navLink(active: boolean) {
  return `inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors md:px-3.5 ${
    active
      ? "border-teal-600/30 bg-teal-50 text-teal-800"
      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
  }`;
}

export function Header({
  locale,
  daypart,
  clock,
  compact = false,
  docsActive = false,
  careActive = false,
  fullscreen = false,
  onLocale,
  onFullscreen,
}: Props) {
  const ui = t(locale);
  return (
    <header className="no-print sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <nav
        className="mx-auto flex min-h-16 w-full max-w-[1400px] items-center justify-between gap-3 px-4 md:gap-4 md:px-6"
        aria-label="Primary"
      >
        <Link href="/" className="flex min-w-0 items-center gap-3 text-slate-900">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-teal-700">
            <ScanFace className="size-5" strokeWidth={1.75} aria-hidden="true" />
          </span>
          {compact ? (
            <h1 className="truncate text-sm font-semibold tracking-tight md:text-base">{ui.product}</h1>
          ) : (
            <span className="truncate text-sm font-semibold tracking-tight md:text-base">{ui.product}</span>
          )}
        </Link>
        <div className="flex shrink-0 items-center justify-end gap-2 md:gap-3">
          {compact && daypart && clock ? (
            <p className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 md:flex md:gap-2">
              <span suppressHydrationWarning>{ui.daypart[daypart]}</span>
              <time className="font-medium tabular-nums text-teal-700" dateTime={clock} suppressHydrationWarning>
                {clock}
              </time>
            </p>
          ) : null}
          {onFullscreen ? (
            <button
              type="button"
              className={navLink(fullscreen)}
              aria-pressed={fullscreen}
              aria-label={fullscreen ? ui.fullscreenExit : ui.fullscreenEnter}
              onClick={onFullscreen}
            >
              {fullscreen ? (
                <Minimize2 className="size-4 text-slate-500" strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <Maximize2 className="size-4 text-slate-500" strokeWidth={1.75} aria-hidden="true" />
              )}
              <span className="hidden lg:inline">{fullscreen ? ui.fullscreenExit : ui.fullscreenEnter}</span>
            </button>
          ) : null}
          <Link href="/docs" className={navLink(docsActive)} aria-label={ui.docs}>
            <BookOpen className="size-4 text-slate-500" strokeWidth={1.75} aria-hidden="true" />
            <span className="hidden lg:inline">{ui.docs}</span>
          </Link>
          <Link href="/bakim-ve-takip-paneli" className={navLink(careActive)} aria-label={ui.care}>
            <ClipboardList className="size-4 text-slate-500" strokeWidth={1.75} aria-hidden="true" />
            <span className="hidden lg:inline">{ui.care}</span>
          </Link>
          <LanguageToggle locale={locale} onChange={onLocale} />
        </div>
      </nav>
    </header>
  );
}
