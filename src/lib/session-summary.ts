import { loadCareJournal } from "@/lib/care-journal";
import { loadCareProfile } from "@/lib/care-profile";
import { localDateKey } from "@/lib/care-profile";
import { loadClinicalSettings } from "@/lib/settings";
import type { Locale } from "@/types";

export type SessionSummary = {
  dateLabel: string;
  printTitle: string;
  userName: string;
  caregiverName: string;
  caregiverPhone: string;
  trigger: string;
  scanSec: number;
  sentences: number;
  sos: number;
  alarms: number;
  notes: number;
  lines: string[];
};

export function buildSessionSummary(locale: Locale, now = new Date()): SessionSummary {
  const today = localDateKey(now);
  const profile = loadCareProfile();
  const settings = loadClinicalSettings();
  const entries = loadCareJournal().filter((row) => localDateKey(new Date(row.at)) === today);
  const loc = locale === "tr" ? "tr-TR" : "en-GB";
  const dateLabel = now.toLocaleDateString(loc, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const printTitle = profile.userName
    ? `${profile.userName} — ${locale === "tr" ? "Oturum özeti" : "Session summary"} — ${dateLabel}`
    : `${locale === "tr" ? "Oturum özeti" : "Session summary"} — ${dateLabel}`;
  const trigger =
    settings.triggerMode === "jaw"
      ? locale === "tr"
        ? "Çene sıkma (masseter)"
        : "Jaw clench (masseter)"
      : locale === "tr"
        ? "Göz kırpma"
        : "Blink";
  const sentences = entries.filter((row) => row.kind === "sentence");
  return {
    dateLabel,
    printTitle,
    userName: profile.userName,
    caregiverName: profile.caregiverName,
    caregiverPhone: profile.caregiverPhone,
    trigger,
    scanSec: Math.round(settings.scanMs / 1000),
    sentences: sentences.length,
    sos: entries.filter((row) => row.kind === "sos").length,
    alarms: entries.filter((row) => row.kind === "alarm").length,
    notes: entries.filter((row) => row.kind === "note").length,
    lines: sentences.slice(-12).map((row) => {
      const time = new Date(row.at).toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" });
      return `${time}  ${row.text}`;
    }),
  };
}
