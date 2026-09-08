"use client";

import { t } from "@/lib/copy";
import type { Locale } from "@/types";

type Props = {
  locale: Locale;
};

export function ScrollToTop({ locale }: Props) {
  const ui = t(locale);

  function scrollUp() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollUp}
      aria-label={ui.scrollTop}
      className="no-print cta-primary fixed bottom-8 right-8 z-40 flex size-12 items-center justify-center rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D9488]"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 15l6-6 6 6" />
      </svg>
    </button>
  );
}
