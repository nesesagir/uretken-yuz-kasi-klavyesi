"use client";

import { t } from "@/lib/copy";
import type { Locale } from "@/types";
import { Moon } from "lucide-react";

type Props = {
  locale: Locale;
  focused: boolean;
  scanMs: number;
  onSelect: () => void;
};

export function SleepCard({ locale, focused, scanMs, onSelect }: Props) {
  const ui = t(locale);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`cell flex min-h-[4.75rem] w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition duration-150 ${
        focused
          ? "is-focus border-teal-600/80 bg-teal-50"
          : "border-slate-200 bg-white"
      }`}
      style={{ ["--scan-ms" as string]: `${scanMs}ms` }}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-teal-700">
        <Moon className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span>
        <span className="block text-base font-semibold text-slate-900">{ui.sleepTitle}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{ui.sleepHint}</span>
      </span>
    </button>
  );
}
