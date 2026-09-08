"use client";

import { t } from "@/lib/copy";
import type { Locale } from "@/types";

type Props = {
  locale: Locale;
  onChange: (locale: Locale) => void;
};

export function LanguageToggle({ locale, onChange }: Props) {
  const ui = t(locale);
  const next = locale === "tr" ? "en" : "tr";

  return (
    <button
      type="button"
      className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-white p-1"
      aria-label={next === "en" ? ui.languageToEn : ui.languageToTr}
      onClick={() => onChange(next)}
    >
      <span
        className={`min-w-9 rounded-md px-2 py-1 text-center text-sm font-semibold ${
          locale === "tr" ? "bg-teal-600 text-white" : "text-slate-400"
        }`}
      >
        TR
      </span>
      <span
        className={`min-w-9 rounded-md px-2 py-1 text-center text-sm font-semibold ${
          locale === "en" ? "bg-teal-600 text-white" : "text-slate-400"
        }`}
      >
        EN
      </span>
    </button>
  );
}
