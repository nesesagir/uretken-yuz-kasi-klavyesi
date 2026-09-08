"use client";

import { SCAN_MS_MAX, SCAN_MS_MIN, SCAN_MS_STEP } from "@/lib/constants";
import { t } from "@/lib/copy";
import type { ClinicalSettings, Locale, TriggerMode } from "@/types";

type Props = {
  locale: Locale;
  settings: ClinicalSettings;
  compact?: boolean;
  onChange: (next: ClinicalSettings) => void;
};

export function SettingsPanel({ locale, settings, compact = false, onChange }: Props) {
  const ui = t(locale);
  const seconds = Math.round(settings.scanMs / 1000);

  function setTrigger(triggerMode: TriggerMode) {
    onChange({ ...settings, triggerMode });
  }

  function setScanSeconds(value: number) {
    onChange({ ...settings, scanMs: value * 1000 });
  }

  return (
    <section
      className={`surface w-full rounded-[1.75rem] md:rounded-[2rem] ${
        compact ? "p-4" : "p-5 md:p-6"
      }`}
      aria-labelledby="accessibility-settings-title"
    >
      <h2
        id="accessibility-settings-title"
        className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500"
      >
        {ui.settingsTitle}
      </h2>

      <fieldset className="mt-4 border-0 p-0">
        <legend className="text-sm font-semibold text-slate-900">{ui.triggerLabel}</legend>
        <div className="mt-3 grid gap-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-teal-600/30 bg-teal-50 px-3 py-3">
            <input
              type="radio"
              name={compact ? "trigger-mode-workspace" : "trigger-mode-hero"}
              className="mt-1 size-4 accent-teal-600"
              checked={settings.triggerMode === "jaw"}
              onChange={() => setTrigger("jaw")}
            />
            <span>
              <span className="block text-sm font-semibold text-slate-900">
                {ui.triggerJaw}
                <span className="ml-2 rounded-full border border-teal-600/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-teal-700">
                  {ui.recommended}
                </span>
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-slate-500">{ui.triggerJawHint}</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            <input
              type="radio"
              name={compact ? "trigger-mode-workspace" : "trigger-mode-hero"}
              className="mt-1 size-4 accent-teal-600"
              checked={settings.triggerMode === "blink"}
              onChange={() => setTrigger("blink")}
            />
            <span>
              <span className="block text-sm font-semibold text-slate-900">{ui.triggerBlink}</span>
              <span className="mt-1 block text-xs leading-relaxed text-slate-500">{ui.triggerBlinkHint}</span>
            </span>
          </label>
        </div>
      </fieldset>

      <div className="mt-5">
        <label htmlFor={compact ? "scan-dwell-workspace" : "scan-dwell-hero"} className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold text-slate-900">{ui.scanLabel}</span>
          <span className="tabular-nums text-sm text-teal-700">
            {seconds} {ui.scanUnit}
          </span>
        </label>
        <input
          id={compact ? "scan-dwell-workspace" : "scan-dwell-hero"}
          type="range"
          min={SCAN_MS_MIN / 1000}
          max={SCAN_MS_MAX / 1000}
          step={SCAN_MS_STEP / 1000}
          value={seconds}
          onChange={(event) => setScanSeconds(Number(event.target.value))}
          className="mt-3 w-full accent-teal-600"
        />
        <p className="mt-2 text-xs leading-relaxed text-slate-500">{ui.scanHint}</p>
      </div>
    </section>
  );
}
