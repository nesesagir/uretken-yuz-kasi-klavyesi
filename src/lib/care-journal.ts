import type { CareJournalEntry, CareJournalKind, Locale } from "@/types";

const STORAGE_KEY = "uykk-care-journal";
export const CARE_JOURNAL_KEY = STORAGE_KEY;
const MAX_ENTRIES = 250;
const MAX_TEXT = 400;

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sanitizeText(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, MAX_TEXT);
}

function sanitizeKeywords(values: string[] | undefined): string[] | undefined {
  if (!values?.length) return undefined;
  const next = values.map((word) => sanitizeText(word)).filter(Boolean).slice(0, 8);
  return next.length ? next : undefined;
}

export function loadCareJournal(): CareJournalEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item): CareJournalEntry | null => {
        if (!item || typeof item !== "object") return null;
        const row = item as Partial<CareJournalEntry>;
        const kind: CareJournalKind | null =
          row.kind === "sentence" ||
          row.kind === "sos" ||
          row.kind === "alarm" ||
          row.kind === "note"
            ? row.kind
            : null;
        const text = sanitizeText(String(row.text ?? ""));
        const at = String(row.at ?? "");
        if (!kind || !text || !at) return null;
        return {
          id: String(row.id ?? makeId()),
          at,
          kind,
          text,
          keywords: sanitizeKeywords(row.keywords),
          locale: row.locale === "en" || row.locale === "tr" ? row.locale : undefined,
        };
      })
      .filter((row): row is CareJournalEntry => row !== null)
      .slice(-MAX_ENTRIES);
  } catch {
    return [];
  }
}

function persist(entries: CareJournalEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    /* quota / private mode */
  }
}

export function appendCareJournal(input: {
  kind: CareJournalKind;
  text: string;
  keywords?: string[];
  locale?: Locale;
}): void {
  const text = sanitizeText(input.text);
  if (!text) return;
  const entries = loadCareJournal();
  entries.push({
    id: makeId(),
    at: new Date().toISOString(),
    kind: input.kind,
    text,
    keywords: sanitizeKeywords(input.keywords),
    locale: input.locale,
  });
  persist(entries);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("uykk-care-update"));
  }
}

export function clearCareJournal(): void {
  persist([]);
}
