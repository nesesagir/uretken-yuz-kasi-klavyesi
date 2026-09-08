"use client";

import { t } from "@/lib/copy";
import type { Locale } from "@/types";

type Props = {
  locale: Locale;
  onWake: () => void;
};

export function SleepOverlay({ locale, onWake }: Props) {
  const ui = t(locale);
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-3xl bg-slate-900/45 px-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sleep-wake-title"
    >
      <p className="text-sm text-white">{ui.sleepCaption}</p>
      <button
        id="sleep-wake-title"
        type="button"
        onClick={onWake}
        className="cta-primary inline-flex min-h-24 w-full max-w-lg items-center justify-center rounded-3xl px-8 py-6 text-2xl font-extrabold tracking-tight transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0D9488] md:min-h-28 md:text-3xl"
      >
        {ui.sleepWake}
      </button>
      <p className="max-w-md text-center text-sm leading-relaxed text-white/80">{ui.sleepWakeHint}</p>
    </div>
  );
}
