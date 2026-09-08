"use client";

import { CaregiverCallButton } from "@/components/CaregiverCallButton";
import { t } from "@/lib/copy";
import type { EmergencyState, Locale } from "@/types";

type Props = {
  locale: Locale;
  state: EmergencyState;
  phone?: string;
  onCancel: () => void;
};

export function EmergencyOverlay({ locale, state, phone = "", onCancel }: Props) {
  const ui = t(locale);
  if (state.phase !== "grace" && state.phase !== "alarm") return null;

  const seconds = Math.max(1, Math.ceil(state.graceRemainingMs / 1000));
  const alarm = state.phase === "alarm";

  return (
    <div
      className={`emergency ${alarm ? "is-alarm" : "is-grace"}`}
      role="alertdialog"
      aria-modal="true"
    >
      <div className="emergency-card w-[min(560px,calc(100%-32px))] rounded-3xl border border-red-200/30 bg-red-950 p-8 text-center">
        <p className="m-0 text-xs font-medium uppercase tracking-[0.16em] text-red-100">
          {alarm ? ui.alarmTitle : ui.graceTitle}
        </p>
        <p className="my-2 text-7xl font-semibold tabular-nums leading-none text-white">{alarm ? "!" : seconds}</p>
        <p className="mb-6 text-red-100">{alarm ? ui.alarmBody : ui.graceBody}</p>
        <button
          type="button"
          className="min-h-[4.5rem] w-full rounded-2xl bg-white text-xl font-extrabold tracking-wide text-red-900"
          onClick={onCancel}
        >
          {ui.cancel}
        </button>
        <CaregiverCallButton locale={locale} phone={phone} />
        <p className="mt-4 text-sm text-red-100/90">{ui.emergencyCancelHint}</p>
      </div>
    </div>
  );
}
