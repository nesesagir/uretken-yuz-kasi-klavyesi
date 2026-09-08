"use client";

import { t } from "@/lib/copy";
import type { GenerateResult, Locale, SentenceAnalytics } from "@/types";

type Props = {
  locale: Locale;
  sentence: string;
  source: GenerateResult["source"] | null;
  generating: boolean;
  speaking: boolean;
  analytics: SentenceAnalytics | null;
};

export function SentenceStage({
  locale,
  sentence,
  source,
  generating,
  speaking,
  analytics,
}: Props) {
  const ui = t(locale);
  return (
    <section className="surface rounded-2xl px-4 py-3">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{ui.sentence}</p>
      {generating ? (
        <p className="m-0 text-xl font-medium tracking-tight text-teal-700 sm:text-2xl">{ui.generating}</p>
      ) : sentence ? (
        <p className="m-0 text-xl font-medium tracking-tight text-slate-900 sm:text-2xl">{sentence}</p>
      ) : (
        <p className="m-0 text-sm text-slate-500">{ui.sentenceEmpty}</p>
      )}
      <div className="mt-2 flex gap-3 text-[11px] uppercase tracking-wider">
        {speaking ? <span className="text-slate-500">{ui.speaking}</span> : null}
        {source === "fallback" ? <span className="text-slate-500">{ui.fallback}</span> : null}
        {source === "gemini" ? <span className="text-teal-700">Gemini</span> : null}
        {source === "openai" ? <span className="text-teal-700">OpenAI</span> : null}
      </div>
      {analytics ? (
        <p className="mt-2 text-[11px] uppercase tracking-wider text-slate-400" aria-hidden="true">
          {analytics.interactions}× · {analytics.latencyMs}ms · {analytics.provider}
        </p>
      ) : null}
    </section>
  );
}
