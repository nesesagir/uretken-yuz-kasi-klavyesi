import type { CareProfile, CareVoiceNote, Locale } from "@/types";

export const CARE_PROFILE_KEY = "uykk-care-profile";
export const CARE_NOTES_KEY = "uykk-care-notes";

const MAX_NAME = 40;
const MAX_NOTE = 280;
const MAX_NOTES = 12;

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function sanitizeCareName(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, MAX_NAME);
}

function sanitizeNoteText(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, MAX_NOTE);
}

function clampHour(value: number): number {
  if (!Number.isFinite(value)) return 8;
  return Math.min(23, Math.max(0, Math.round(value)));
}

function clampMinute(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(59, Math.max(0, Math.round(value)));
}

export function defaultCareProfile(): CareProfile {
  return { userName: "", caregiverName: "", caregiverPhone: "" };
}

export function sanitizeCarePhone(value: string): string {
  const compact = value.replace(/[^\d+]/g, "");
  const plus = compact.startsWith("+") ? "+" : "";
  const digits = compact.replace(/\+/g, "").slice(0, 15);
  return `${plus}${digits}`.slice(0, 16);
}

export function loadCareProfile(): CareProfile {
  const fallback = defaultCareProfile();
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(CARE_PROFILE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<CareProfile>;
    return {
      userName: sanitizeCareName(String(parsed.userName ?? "")),
      caregiverName: sanitizeCareName(String(parsed.caregiverName ?? "")),
      caregiverPhone: sanitizeCarePhone(String(parsed.caregiverPhone ?? "")),
    };
  } catch {
    return fallback;
  }
}

export function saveCareProfile(next: CareProfile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CARE_PROFILE_KEY,
      JSON.stringify({
        userName: sanitizeCareName(next.userName),
        caregiverName: sanitizeCareName(next.caregiverName),
        caregiverPhone: sanitizeCarePhone(next.caregiverPhone),
      }),
    );
    window.dispatchEvent(new Event("uykk-care-update"));
  } catch {
    /* quota / private mode */
  }
}

function parseDateKey(value: unknown): string | undefined {
  const raw = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
  const [year, month, day] = raw.split("-").map(Number);
  const local = new Date(year, month - 1, day);
  if (local.getFullYear() !== year || local.getMonth() !== month - 1 || local.getDate() !== day) {
    return undefined;
  }
  return raw;
}

function parseNote(raw: unknown): CareVoiceNote | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<CareVoiceNote>;
  const text = sanitizeNoteText(String(row.text ?? ""));
  if (!text) return null;
  const date = parseDateKey(row.date);
  return {
    id: String(row.id ?? makeId()),
    text,
    ...(date ? { date } : {}),
    hour: clampHour(Number(row.hour)),
    minute: clampMinute(Number(row.minute)),
    enabled: row.enabled !== false,
    lastSpokenOn: typeof row.lastSpokenOn === "string" ? row.lastSpokenOn : null,
  };
}

export function loadCareNotes(): CareVoiceNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CARE_NOTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(parseNote).filter((row): row is CareVoiceNote => row !== null).slice(0, MAX_NOTES);
  } catch {
    return [];
  }
}

export function saveCareNotes(notes: CareVoiceNote[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CARE_NOTES_KEY, JSON.stringify(notes.slice(0, MAX_NOTES)));
    window.dispatchEvent(new Event("uykk-care-update"));
  } catch {
    /* quota / private mode */
  }
}

export function addCareNote(input: {
  text: string;
  date: string;
  hour: number;
  minute: number;
}): CareVoiceNote | null {
  const text = sanitizeNoteText(input.text);
  const date = parseDateKey(input.date);
  if (!text || !date) return null;
  const notes = loadCareNotes();
  if (notes.length >= MAX_NOTES) return null;
  const next: CareVoiceNote = {
    id: makeId(),
    text,
    date,
    hour: clampHour(input.hour),
    minute: clampMinute(input.minute),
    enabled: true,
    lastSpokenOn: null,
  };
  notes.push(next);
  saveCareNotes(notes);
  return next;
}

export function updateCareNote(id: string, patch: Partial<Pick<CareVoiceNote, "enabled" | "lastSpokenOn">>): void {
  const notes = loadCareNotes().map((note) => (note.id === id ? { ...note, ...patch } : note));
  saveCareNotes(notes);
}

export function removeCareNote(id: string): void {
  saveCareNotes(loadCareNotes().filter((note) => note.id !== id));
}

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatNoteClock(hour: number, minute: number): string {
  return `${String(clampHour(hour)).padStart(2, "0")}:${String(clampMinute(minute)).padStart(2, "0")}`;
}

export function formatNoteSchedule(
  note: Pick<CareVoiceNote, "date" | "hour" | "minute">,
  locale: Locale,
): string {
  const clock = formatNoteClock(note.hour, note.minute);
  const date = parseDateKey(note.date);
  if (!date) return clock;
  const [year, month, day] = date.split("-").map(Number);
  const label = new Date(year, month - 1, day).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${label}  ${clock}`;
}

const DUE_WINDOW_MS = 90_000;

export function isCareNoteDue(note: CareVoiceNote, now = new Date()): boolean {
  if (!note.enabled || !note.text) return false;
  const today = localDateKey(now);
  if (note.date && note.date !== today) return false;
  if (note.lastSpokenOn === today) return false;
  const scheduled = new Date(now);
  scheduled.setHours(note.hour, note.minute, 0, 0);
  const delta = now.getTime() - scheduled.getTime();
  return delta >= 0 && delta < DUE_WINDOW_MS;
}
