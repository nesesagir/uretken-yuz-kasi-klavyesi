"use client";

import { CaregiverCallButton } from "@/components/CaregiverCallButton";
import { t } from "@/lib/copy";
import type { Locale, SosState } from "@/types";

type Props = {
  locale: Locale;
  state: SosState;
  phone?: string;
  onCancel: () => void;
};

export function SosOverlay({ locale, state, phone = "", onCancel }: Props) {
  const ui = t(locale);
  if (!state.active) return null;

  const reason = state.reason === "jaw-hold" ? ui.sosReasonJaw : ui.sosReasonLid;

  return (
    <div className="emergency is-alarm" role="alertdialog" aria-modal="true" aria-labelledby="sos-title">
      <div className="emergency-card w-[min(560px,calc(100%-32px))] rounded-3xl border border-red-200/30 bg-red-950 p-8 text-center">
        <p id="sos-title" className="m-0 text-xs font-medium uppercase tracking-[0.16em] text-red-100">
          {ui.sosTitle}
        </p>
        <p className="my-3 text-5xl font-semibold leading-none text-white">SOS</p>
        <p className="text-xl font-semibold text-white">{ui.sosBreath}</p>
        <p className="mt-1 text-xl font-semibold text-white">{ui.sosSwallow}</p>
        <p className="mt-4 text-red-100">{reason}</p>
        <p className="mt-2 text-sm text-red-200/90">{ui.sosBody}</p>
        <button
          type="button"
          className="mt-6 min-h-[4.5rem] w-full rounded-2xl bg-white text-xl font-extrabold tracking-wide text-red-900"
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
