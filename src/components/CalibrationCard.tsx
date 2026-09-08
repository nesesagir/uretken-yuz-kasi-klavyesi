"use client";

import { t } from "@/lib/copy";
import type { Locale, PipelinePhase } from "@/types";
import { Loader2 } from "lucide-react";

type Props = {
  locale: Locale;
  phase: PipelinePhase;
  progress: number;
};

export function CalibrationCard({ locale, phase, progress }: Props) {
  const ui = t(locale);
  const calibrating = phase === "calibrating";
  const message = calibrating
    ? ui.baselineBody
    : phase === "loading-model"
      ? ui.loadingModel
      : phase === "awaiting-face"
        ? ui.awaitingFace
        : ui.awaitingPermission;
  const fill = calibrating ? Math.round(progress * 100) : phase === "awaiting-face" ? 35 : 18;

  return (
    <section
      className="surface w-full max-w-xl rounded-3xl px-6 py-8 text-center md:px-10 md:py-10"
      role="status"
      aria-live="polite"
      aria-labelledby="calibration-title"
    >
      <Loader2
        className="mx-auto size-8 animate-spin text-teal-500 motion-reduce:animate-none"
        aria-hidden="true"
      />
      <h2 id="calibration-title" className="mt-5 text-lg font-semibold tracking-tight text-slate-900 md:text-xl">
        {ui.baselineTitle}
      </h2>
      <p className="mt-3 text-base leading-relaxed text-slate-600">{message}</p>
      <div className="meter-track mt-6 h-2.5">
        <i className="meter-fill tone-mint transition-[width] duration-200" style={{ width: `${fill}%` }} />
      </div>
      {calibrating ? (
        <p className="mt-3 tabular-nums text-sm text-teal-700">{Math.max(1, Math.ceil((1 - progress) * 5))} {ui.scanUnit}</p>
      ) : null}
    </section>
  );
}
