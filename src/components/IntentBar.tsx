"use client";

import { t } from "@/lib/copy";
import type { Locale } from "@/types";

type Props = {
  locale: Locale;
  keywords: string[];
  emptyHint?: string;
  onRemove?: (index: number) => void;
};

export function IntentBar({ locale, keywords, emptyHint, onRemove }: Props) {
  const ui = t(locale);
  return (
    <section className="surface rounded-2xl px-4 py-3">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{ui.intent}</p>
      {keywords.length === 0 ? (
        <p className="m-0 text-sm text-slate-600">{emptyHint ?? ui.intentEmpty}</p>
      ) : (
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {keywords.map((word, index) => (
            <li key={`${word}-${index}`}>
              {onRemove ? (
                <button
                  type="button"
                  className="rounded-full border border-teal-600/20 bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800 transition hover:border-teal-700/40 hover:bg-teal-100"
                  title={ui.keywordRemove}
                  onClick={() => onRemove(index)}
                >
                  {word}
                  <span className="sr-only"> — {ui.keywordRemove}</span>
                </button>
              ) : (
                <span className="rounded-full border border-teal-600/20 bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800">
                  {word}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
