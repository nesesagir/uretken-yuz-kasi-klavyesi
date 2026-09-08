import { CONTEXT_SLOTS, CORE_IDS, VOCABULARY } from "@/lib/vocabulary";
import { defaultVocabPrefs, resolveContextWords } from "@/lib/vocab-prefs";
import type { ActionId, Daypart, GridCell, VocabPrefs, Word } from "@/types";

export function getDaypart(date: Date = new Date()): Daypart {
  const hour = date.getHours();
  if (hour >= 6 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

export function rankContextWords(daypart: Daypart, pool: Word[] = VOCABULARY): Word[] {
  return pool
    .filter((word) => !CORE_IDS.includes(word.id as (typeof CORE_IDS)[number]))
    .sort((a, b) => b.weights[daypart] - a.weights[daypart])
    .slice(0, CONTEXT_SLOTS);
}

export function buildGrid(daypart: Daypart, prefs: VocabPrefs = defaultVocabPrefs()): GridCell[] {
  const core = CORE_IDS.map((id) => VOCABULARY.find((word) => word.id === id)).filter(
    (word): word is Word => Boolean(word),
  );
  const context = resolveContextWords(daypart, prefs);

  const words: GridCell[] = [...core, ...context].map((word) => ({
    kind: "word",
    word,
  }));

  const actions: GridCell[] = [
    { kind: "action", action: "delete", tr: "Geri al", en: "Undo" },
    { kind: "action", action: "clear", tr: "Yeni cümle", en: "New sentence" },
    { kind: "action", action: "generate", tr: "Üret", en: "Generate" },
    { kind: "action", action: "repeat", tr: "Yeniden seslendir", en: "Play again" },
  ];

  return [...words, ...actions];
}

export function isAction(id: ActionId, cell: GridCell): boolean {
  return cell.kind === "action" && cell.action === id;
}
