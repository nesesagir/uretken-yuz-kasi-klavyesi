import { CONTEXT_SLOTS, CORE_IDS, VOCABULARY } from "@/lib/vocabulary";
import type { CustomContextWord, VocabPrefs, Word } from "@/types";

export const VOCAB_PREFS_KEY = "uykk-vocab-prefs";
export const VOCAB_UPDATE_EVENT = "uykk-vocab-update";

const MAX_LABEL = 24;

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `c-${crypto.randomUUID()}`;
  }
  return `c-${Date.now().toString(16)}`;
}

function sanitizeLabel(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, MAX_LABEL);
}

export function defaultVocabPrefs(): VocabPrefs {
  return { selectedIds: [], custom: [] };
}

export function selectableVocabulary(): Word[] {
  return VOCABULARY.filter((word) => !CORE_IDS.includes(word.id as (typeof CORE_IDS)[number]));
}

export function loadVocabPrefs(): VocabPrefs {
  const fallback = defaultVocabPrefs();
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(VOCAB_PREFS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<VocabPrefs>;
    const allowed = new Set(selectableVocabulary().map((word) => word.id));
    const selectedIds = Array.isArray(parsed.selectedIds)
      ? parsed.selectedIds.filter((id): id is string => typeof id === "string" && allowed.has(id))
      : [];
    const custom = Array.isArray(parsed.custom)
      ? parsed.custom
          .map((row): CustomContextWord | null => {
            if (!row || typeof row !== "object") return null;
            const tr = sanitizeLabel(String(row.tr ?? ""));
            if (!tr) return null;
            const en = sanitizeLabel(String(row.en ?? "")) || tr;
            return { id: String(row.id ?? makeId()), tr, en };
          })
          .filter((row): row is CustomContextWord => row !== null)
      : [];
    return trimPrefs({ selectedIds, custom });
  } catch {
    return fallback;
  }
}

function trimPrefs(prefs: VocabPrefs): VocabPrefs {
  const selectedIds: string[] = [];
  for (const id of prefs.selectedIds) {
    if (selectedIds.includes(id)) continue;
    if (selectedIds.length + prefs.custom.length >= CONTEXT_SLOTS) break;
    selectedIds.push(id);
  }
  const custom = prefs.custom.slice(0, Math.max(0, CONTEXT_SLOTS - selectedIds.length));
  return { selectedIds, custom };
}

export function saveVocabPrefs(next: VocabPrefs): void {
  if (typeof window === "undefined") return;
  const trimmed = trimPrefs(next);
  try {
    window.localStorage.setItem(VOCAB_PREFS_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new Event(VOCAB_UPDATE_EVENT));
  } catch {
    /* quota */
  }
}

export function prefsCount(prefs: VocabPrefs): number {
  return prefs.selectedIds.length + prefs.custom.length;
}

export function toggleVocabId(prefs: VocabPrefs, id: string): VocabPrefs {
  if (prefs.selectedIds.includes(id)) {
    return { ...prefs, selectedIds: prefs.selectedIds.filter((item) => item !== id) };
  }
  if (prefsCount(prefs) >= CONTEXT_SLOTS) return prefs;
  return { ...prefs, selectedIds: [...prefs.selectedIds, id] };
}

export function addCustomWord(prefs: VocabPrefs, label: string): VocabPrefs {
  const text = sanitizeLabel(label);
  if (!text || prefsCount(prefs) >= CONTEXT_SLOTS) return prefs;
  return {
    ...prefs,
    custom: [...prefs.custom, { id: makeId(), tr: text, en: text }],
  };
}

export function removeCustomWord(prefs: VocabPrefs, id: string): VocabPrefs {
  return { ...prefs, custom: prefs.custom.filter((word) => word.id !== id) };
}

export function resolveContextWords(daypart: import("@/types").Daypart, prefs: VocabPrefs): Word[] {
  const picked: Word[] = [];
  const seen = new Set<string>();
  const uniform = { morning: 1, afternoon: 1, evening: 1, night: 1 } as const;

  for (const id of prefs.selectedIds) {
    const word = VOCABULARY.find((item) => item.id === id);
    if (!word || seen.has(word.id) || picked.length >= CONTEXT_SLOTS) continue;
    picked.push(word);
    seen.add(word.id);
  }
  for (const extra of prefs.custom) {
    if (picked.length >= CONTEXT_SLOTS || seen.has(extra.id)) continue;
    picked.push({
      id: extra.id,
      tr: extra.tr,
      en: extra.en,
      category: "need",
      weights: { ...uniform },
    });
    seen.add(extra.id);
  }
  if (picked.length >= CONTEXT_SLOTS) return picked;

  const ranked = VOCABULARY.filter(
    (word) => !CORE_IDS.includes(word.id as (typeof CORE_IDS)[number]) && !seen.has(word.id),
  ).sort((a, b) => b.weights[daypart] - a.weights[daypart]);

  for (const word of ranked) {
    picked.push(word);
    seen.add(word.id);
    if (picked.length >= CONTEXT_SLOTS) break;
  }
  return picked;
}
