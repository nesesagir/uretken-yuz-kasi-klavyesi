"use client";

import type { GridCell, Locale } from "@/types";

type Props = {
  locale: Locale;
  cells: GridCell[];
  focusIndex: number;
  generateReady: boolean;
  scanMs: number;
  onCell: (index: number) => void;
};

export function WordGrid({ locale, cells, focusIndex, generateReady, scanMs, onCell }: Props) {
  return (
    <div className="surface min-h-0 rounded-3xl">
      <ul
        className="m-0 grid list-none grid-cols-2 gap-2 p-3 md:grid-cols-4"
        style={{ ["--scan-ms" as string]: `${scanMs}ms` }}
      >
        {cells.map((cell, index) => {
          const label = cell.kind === "word" ? cell.word[locale] : cell[locale];
          const action = cell.kind === "action" ? cell.action : "word";
          const ready = action === "generate" && generateReady;
          const generate = action === "generate";
          return (
            <li key={cell.kind === "word" ? cell.word.id : cell.action}>
              <button
                type="button"
                className={`cell min-h-16 w-full rounded-2xl border px-2 py-2.5 text-center transition duration-150 md:min-h-[4.6rem] ${
                  generate
                    ? "action-generate border-teal-600/30 bg-teal-50"
                    : "border-slate-200 bg-white"
                } ${ready ? "border-teal-600/70" : ""} ${index === focusIndex ? "is-focus" : ""}`}
                onClick={() => onCell(index)}
              >
                <span className="block text-[1.05rem] font-semibold text-slate-800">{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
