import {
  SCAN_MS_DEFAULT,
  SCAN_MS_MAX,
  SCAN_MS_MIN,
  SCAN_MS_STEP,
} from "@/lib/constants";
import type { ClinicalSettings, TriggerMode } from "@/types";

const STORAGE_KEY = "uykk-clinical-settings";

export const defaultClinicalSettings = (): ClinicalSettings => ({
  triggerMode: "jaw",
  scanMs: SCAN_MS_DEFAULT,
});

function clampScanMs(value: number): number {
  const stepped = Math.round(value / SCAN_MS_STEP) * SCAN_MS_STEP;
  return Math.min(SCAN_MS_MAX, Math.max(SCAN_MS_MIN, stepped));
}

export function loadClinicalSettings(): ClinicalSettings {
  const fallback = defaultClinicalSettings();
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<ClinicalSettings>;
    const triggerMode: TriggerMode =
      parsed.triggerMode === "blink" ? "blink" : "jaw";
    return {
      triggerMode,
      scanMs: clampScanMs(Number(parsed.scanMs) || SCAN_MS_DEFAULT),
    };
  } catch {
    return fallback;
  }
}

export function saveClinicalSettings(next: ClinicalSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        triggerMode: next.triggerMode,
        scanMs: clampScanMs(next.scanMs),
      }),
    );
  } catch {
    /* quota / private mode */
  }
}
