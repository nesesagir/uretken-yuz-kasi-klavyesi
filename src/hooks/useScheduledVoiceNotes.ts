"use client";

import { appendCareJournal } from "@/lib/care-journal";
import {
  isCareNoteDue,
  loadCareNotes,
  localDateKey,
  updateCareNote,
} from "@/lib/care-profile";
import { speak, warmVoices } from "@/lib/speech";
import type { Locale } from "@/types";
import { useEffect } from "react";

export function useScheduledVoiceNotes(locale: Locale, paused: boolean) {
  useEffect(() => {
    warmVoices();

    function tick() {
      if (paused || document.hidden) return;
      if (typeof window !== "undefined" && window.speechSynthesis?.speaking) return;

      const notes = loadCareNotes();
      const today = localDateKey();
      const due = notes.find((note) => isCareNoteDue(note));
      if (!due) return;

      updateCareNote(due.id, { lastSpokenOn: today });
      speak(due.text, locale);
      appendCareJournal({ kind: "note", text: due.text, locale });
    }

    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, [locale, paused]);
}
