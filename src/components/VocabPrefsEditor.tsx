"use client";

import { t } from "@/lib/copy";
import {
  addCustomWord,
  loadVocabPrefs,
  prefsCount,
  removeCustomWord,
  saveVocabPrefs,
  selectableVocabulary,
  toggleVocabId,
} from "@/lib/vocab-prefs";
import { CONTEXT_SLOTS } from "@/lib/vocabulary";
import type { Locale, VocabPrefs } from "@/types";
import { useEffect, useState } from "react";

type Props = {
  locale: Locale;
};

export function VocabPrefsEditor({ locale }: Props) {
  const ui = t(locale);
  const [prefs, setPrefs] = useState<VocabPrefs>({ selectedIds: [], custom: [] });
  const [draft, setDraft] = useState("");
  const [wordLocale, setWordLocale] = useState<Locale>(locale);
  const pool = selectableVocabulary();
  const used = prefsCount(prefs);

  useEffect(() => {
    setPrefs(loadVocabPrefs());
  }, []);

  function commit(next: VocabPrefs) {
    setPrefs(next);
    saveVocabPrefs(next);
  }

  return (
    <section className="no-print mt-6 border-t border-slate-200 pt-6">
      <h2 className="text-[13px] font-semibold text-slate-900">{ui.vocabTitle}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{ui.vocabHint}</p>
      <p className="mt-2 text-xs tabular-nums text-slate-500">
        {used} / {CONTEXT_SLOTS}
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {pool.map((word) => {
          const on = prefs.selectedIds.includes(word.id);
          return (
            <li key={word.id}>
              <button
                type="button"
                aria-pressed={on}
                disabled={!on && used >= CONTEXT_SLOTS}
                className={`inline-flex min-h-9 items-center rounded-lg border px-3.5 text-[13px] font-medium tracking-wide ${
                  on
                    ? "border-teal-600/40 bg-teal-50 text-teal-800 shadow-[0_1px_0_rgba(13,148,136,0.16)]"
                    : "border-slate-200 bg-[#F8FAFB] text-slate-700 shadow-[0_1px_0_rgba(15,23,42,0.04)] hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                }`}
                onClick={() => commit(toggleVocabId(prefs, word.id))}
              >
                {word[locale]}
              </button>
            </li>
          );
        })}
      </ul>
      {prefs.custom.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {prefs.custom.map((word) => (
            <li key={word.id}>
              <button
                type="button"
                className="inline-flex min-h-9 items-center rounded-lg border border-teal-600/40 bg-teal-50 px-3.5 text-[13px] font-medium tracking-wide text-teal-800 shadow-[0_1px_0_rgba(13,148,136,0.16)]"
                onClick={() => commit(removeCustomWord(prefs, word.id))}
                title={ui.notesDelete}
              >
                {word[locale]} ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <form
        className="mt-4"
        onSubmit={(event) => {
          event.preventDefault();
          const next = addCustomWord(prefs, draft);
          if (next === prefs) return;
          commit(next);
          setDraft("");
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="vocab-custom" className="text-[13px] font-medium text-slate-600">
            {ui.vocabCustom}
          </label>
          <div className="inline-flex items-center rounded-md border border-slate-200 bg-white p-0.5" role="group" aria-label={ui.vocabCustom}>
            <button
              type="button"
              aria-pressed={wordLocale === "tr"}
              className={`min-w-8 rounded px-2 py-0.5 text-[11px] font-semibold ${
                wordLocale === "tr" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-slate-700"
              }`}
              onClick={() => setWordLocale("tr")}
            >
              TR
            </button>
            <button
              type="button"
              aria-pressed={wordLocale === "en"}
              className={`min-w-8 rounded px-2 py-0.5 text-[11px] font-semibold ${
                wordLocale === "en" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-slate-700"
              }`}
              onClick={() => setWordLocale("en")}
            >
              EN
            </button>
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          <input
            id="vocab-custom"
            value={draft}
            maxLength={24}
            onChange={(event) => setDraft(event.target.value)}
            className="min-h-12 w-full rounded-xl border border-slate-200 bg-[#F8FAFB] px-4 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-teal-600"
          />
          <button
            type="submit"
            disabled={!draft.trim() || used >= CONTEXT_SLOTS}
            className="inline-flex min-h-12 min-w-[7.5rem] shrink-0 items-center justify-center rounded-xl bg-teal-600 px-5 text-base font-semibold text-white hover:bg-teal-700 disabled:opacity-40"
          >
            {ui.vocabCustomAdd}
          </button>
        </div>
      </form>
    </section>
  );
}
