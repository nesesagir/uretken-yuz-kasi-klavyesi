"use client";

import { requestAlertPermission } from "@/lib/browser-notify";
import { loadCareProfile } from "@/lib/care-profile";
import { t } from "@/lib/copy";
import type { ClinicalSettings, Locale } from "@/types";
import { useMemo, useState } from "react";

type Props = {
  locale: Locale;
  settings: ClinicalSettings;
  onCancel: () => void;
  onConfirm: (opts: { fullscreen: boolean }) => void;
};

export function SessionProtocol({ locale, settings, onCancel, onConfirm }: Props) {
  const ui = t(locale);
  const profile = useMemo(() => loadCareProfile(), []);
  const [light, setLight] = useState(false);
  const [face, setFace] = useState(false);
  const [control, setControl] = useState(false);
  const [caregiver, setCaregiver] = useState(false);
  const [safety, setSafety] = useState(false);
  const [notify, setNotify] = useState<NotificationPermission | "unsupported" | "idle">("idle");
  const ready = light && face && control && caregiver && safety;

  async function onNotify() {
    const permission = await requestAlertPermission();
    setNotify(permission);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-protocol-title"
    >
      <div className="surface max-h-[min(92dvh,46rem)] w-[min(34rem,calc(100%-1.5rem))] overflow-y-auto rounded-[1.75rem] p-6 text-left md:p-8">
        <p className="m-0 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{ui.protocolKicker}</p>
        <h2 id="session-protocol-title" className="mt-2 text-xl font-semibold tracking-tight text-slate-900 md:text-[1.35rem]">
          {ui.protocolTitle}
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{ui.protocolLead}</p>
        <ul className="mt-5 grid gap-2.5">
          <CheckRow
            id="p-light"
            checked={light}
            onChange={setLight}
            title={ui.protocolLightTitle}
            body={ui.protocolLight}
          />
          <CheckRow
            id="p-face"
            checked={face}
            onChange={setFace}
            title={ui.protocolFaceTitle}
            body={ui.protocolFace}
          />
          <CheckRow
            id="p-control"
            checked={control}
            onChange={setControl}
            title={ui.protocolControlTitle}
            body={settings.triggerMode === "jaw" ? ui.protocolControlJaw : ui.protocolControlBlink}
          />
          <CheckRow
            id="p-care"
            checked={caregiver}
            onChange={setCaregiver}
            title={ui.protocolCaregiverTitle}
            body={ui.protocolCaregiver}
            note={profile.caregiverPhone ? `${ui.protocolCarePhone}: ${profile.caregiverPhone}` : undefined}
          />
          <CheckRow
            id="p-safety"
            checked={safety}
            onChange={setSafety}
            title={ui.protocolSafetyTitle}
            body={ui.protocolSafety}
          />
        </ul>
        <button
          type="button"
          className="mt-5 text-left text-sm leading-relaxed text-teal-800 hover:underline"
          onClick={() => void onNotify()}
        >
          {notify === "granted" ? ui.protocolNotifyOn : ui.protocolNotify}
        </button>
        <div className="mt-6 grid gap-2">
          <button
            type="button"
            disabled={!ready}
            className="cta-primary min-h-[3.25rem] w-full rounded-2xl text-base font-bold disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => onConfirm({ fullscreen: true })}
          >
            {ui.protocolStart}
          </button>
          <button
            type="button"
            className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-600"
            onClick={onCancel}
          >
            {ui.protocolCancel}
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckRow({
  id,
  checked,
  onChange,
  title,
  body,
  note,
}: {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  body: string;
  note?: string;
}) {
  return (
    <li>
      <label
        htmlFor={id}
        className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors ${
          checked ? "border-teal-600/30 bg-teal-50/80" : "border-slate-200 bg-slate-50/70"
        }`}
      >
        <input
          id={id}
          type="checkbox"
          className="mt-1 size-4 shrink-0 accent-teal-600"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-900">{title}</span>
          <span className="mt-0.5 block text-[13px] leading-relaxed text-slate-600">{body}</span>
          {note ? <span className="mt-1 block text-xs tabular-nums text-slate-500">{note}</span> : null}
        </span>
      </label>
    </li>
  );
}
