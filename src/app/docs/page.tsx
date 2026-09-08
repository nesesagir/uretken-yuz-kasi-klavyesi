"use client";

import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { t } from "@/lib/copy";
import type { Locale } from "@/types";
import {
  Activity,
  AlertTriangle,
  Bell,
  ClipboardCheck,
  LayoutGrid,
  Maximize2,
  Moon,
  ScanFace,
  ShieldCheck,
  SlidersHorizontal,
  Timer,
} from "lucide-react";
import { useState } from "react";

export default function DocsPage() {
  const [locale, setLocale] = useState<Locale>("tr");
  const ui = t(locale);
  const sections = [
    { title: ui.docsConceptTitle, body: ui.docsConceptBody, Icon: ScanFace },
    { title: ui.docsMasseterTitle, body: ui.docsMasseterBody, Icon: Activity },
    { title: ui.docsBaselineTitle, body: ui.docsBaselineBody, Icon: ShieldCheck },
    { title: ui.docsPaceTitle, body: ui.docsPaceBody, Icon: Timer },
    { title: ui.docsSosTitle, body: ui.docsSosBody, Icon: AlertTriangle },
    { title: ui.docsSleepTitle, body: ui.docsSleepBody, Icon: Moon },
    { title: ui.docsPrivacyTitle, body: ui.docsPrivacyBody, Icon: ShieldCheck },
    { title: ui.docsSafetyTitle, body: ui.docsSafetyBody, Icon: SlidersHorizontal },
    { title: ui.docsProtocolTitle, body: ui.docsProtocolBody, Icon: ClipboardCheck },
    { title: ui.docsVocabTitle, body: ui.docsVocabBody, Icon: LayoutGrid },
    { title: ui.docsKioskTitle, body: ui.docsKioskBody, Icon: Maximize2 },
    { title: ui.docsNoticeTitle, body: ui.docsNoticeBody, Icon: Bell },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <Header locale={locale} docsActive onLocale={setLocale} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 md:px-6 md:py-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{ui.docs}</p>
        <h1 className="hero-title mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{ui.product}</h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">{ui.docsLead}</p>
        <ul className="mt-10 grid gap-4">
          {sections.map((section) => (
            <li key={section.title} className="surface rounded-2xl p-6">
              <section.Icon className="mb-3 size-6 text-teal-700" strokeWidth={1.75} aria-hidden="true" />
              <h2 className="text-base font-semibold text-teal-800">{section.title}</h2>
              <p className="mt-2 text-base leading-relaxed text-slate-600">{section.body}</p>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
