"use client";

import { t } from "@/lib/copy";
import type { Locale } from "@/types";

type Props = {
  locale: Locale;
  phone: string;
  variant?: "emergency" | "panel";
};

export function CaregiverCallButton({ locale, phone, variant = "emergency" }: Props) {
  const ui = t(locale);
  if (!phone) return null;
  const href = `tel:${phone}`;
  const emergency = variant === "emergency";
  return (
    <a
      href={href}
      className={
        emergency
          ? "mt-3 inline-flex min-h-[3.5rem] w-full items-center justify-center rounded-2xl border border-white/40 bg-white/10 text-lg font-bold text-white"
          : "mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white hover:bg-rose-800"
      }
    >
      {ui.callCaregiver} · {phone}
    </a>
  );
}
