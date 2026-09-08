"use client";

import { t } from "@/lib/copy";
import type { LlmId, Locale } from "@/types";

type Props = {
  locale: Locale;
  provider: LlmId;
  onChange: (provider: LlmId) => void;
};

export function LlmToggle({ locale, provider, onChange }: Props) {
  const ui = t(locale);
  const btn = (active: boolean) =>
    `min-h-10 px-3.5 text-sm font-semibold transition ${
      active ? "bg-teal-600 text-white" : "bg-transparent text-slate-500 hover:text-slate-900"
    }`;

  return (
    <div className="flex overflow-hidden rounded-full border border-slate-200 bg-white" role="group" aria-label={ui.llm}>
      <button
        type="button"
        className={btn(provider === "gemini")}
        onClick={() => onChange("gemini")}
        aria-pressed={provider === "gemini"}
      >
        Gemini
      </button>
      <button
        type="button"
        className={btn(provider === "openai")}
        onClick={() => onChange("openai")}
        aria-pressed={provider === "openai"}
      >
        OpenAI
      </button>
    </div>
  );
}
