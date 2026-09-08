"use client";

import { CareJournalView } from "@/components/CareJournalView";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { useScheduledVoiceNotes } from "@/hooks/useScheduledVoiceNotes";
import type { Locale } from "@/types";
import { useState } from "react";

export default function PanelPage() {
  const [locale, setLocale] = useState<Locale>("tr");
  useScheduledVoiceNotes(locale, false);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header locale={locale} careActive onLocale={setLocale} />
      <main className="flex-1 px-4 py-8 md:px-6 md:py-10">
        <CareJournalView locale={locale} />
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
