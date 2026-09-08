"use client";

import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { t } from "@/lib/copy";
import type { Locale } from "@/types";
import { HeartPulse } from "lucide-react";
import { useState } from "react";

export default function PrivacyPage() {
  const [locale, setLocale] = useState<Locale>("tr");
  const ui = t(locale);
  const sections = [
    { title: ui.privacyCameraTitle, body: ui.privacyCameraBody },
    { title: ui.privacyStoreTitle, body: ui.privacyStoreBody },
    { title: ui.privacyLlmTitle, body: ui.privacyLlmBody },
    { title: ui.privacyAlertTitle, body: ui.privacyAlertBody },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <Header locale={locale} onLocale={setLocale} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 md:px-6 md:py-20">
        <h1 className="hero-title text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
          {ui.privacyHeading}
        </h1>
        <p className="mt-8 flex items-start gap-2.5 text-lg leading-relaxed text-slate-600">
          <HeartPulse className="mt-1 size-5 shrink-0 text-teal-700" strokeWidth={1.75} aria-hidden="true" />
          <span>{ui.privacyIntro}</span>
        </p>
        <p className="mt-3 flex items-start gap-2.5 text-lg leading-relaxed text-slate-600">
          <HeartPulse className="mt-1 size-5 shrink-0 text-teal-700" strokeWidth={1.75} aria-hidden="true" />
          <span>{ui.privacyLead}</span>
        </p>

        <ul className="mt-14 grid gap-12">
          {sections.map((section) => (
            <li key={section.title}>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">{section.title}</h2>
              <p className="mt-3 text-lg leading-relaxed text-slate-600">{section.body}</p>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
