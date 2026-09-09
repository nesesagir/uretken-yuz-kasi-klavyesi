"use client";

import { SettingsPanel } from "@/components/SettingsPanel";
import { t } from "@/lib/copy";
import type { ClinicalSettings, Locale } from "@/types";
import { Globe, Loader2, Play, ShieldCheck, SlidersHorizontal } from "lucide-react";

type Props = {
  locale: Locale;
  starting?: boolean;
  startError?: boolean;
  settings: ClinicalSettings;
  onSettings: (next: ClinicalSettings) => void;
  onStart: () => void;
};

export function HeroScreen({
  locale,
  starting = false,
  startError = false,
  settings,
  onSettings,
  onStart,
}: Props) {
  const ui = t(locale);
  const features = [
    { title: ui.featureBrowser, body: ui.featureBrowserBody, Icon: Globe },
    { title: ui.featureFidelity, body: ui.featureFidelityBody, Icon: ShieldCheck },
    { title: ui.featurePersonal, body: ui.featurePersonalBody, Icon: SlidersHorizontal },
  ];

  return (
    <section className="flex flex-1 flex-col items-center justify-center px-4 py-12 md:py-16 lg:py-24">
      <div className="flex w-full max-w-5xl flex-col items-center gap-10 md:gap-12 lg:gap-16">
        <div className="flex flex-col items-center gap-4 md:gap-5">
          <h1 className="hero-title animate-fade-in-up max-w-5xl text-center text-4xl font-semibold tracking-tight text-slate-900 motion-reduce:animate-none md:text-5xl lg:text-6xl">
            {ui.product}
          </h1>
          <p className="animate-fade-in-up max-w-2xl text-center text-lg font-medium leading-relaxed text-slate-600 motion-reduce:animate-none [animation-delay:80ms] md:text-xl">
            {ui.heroLead}
          </p>
          <p className="animate-fade-in-up max-w-2xl text-center text-base leading-relaxed text-slate-600 motion-reduce:animate-none [animation-delay:120ms] md:text-lg">
            {ui.heroBody}
          </p>
        </div>

        <ul id="ozellikler" className="grid w-full max-w-4xl grid-cols-1 gap-5 md:grid-cols-3 md:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <li
              key={feature.title}
              className="surface animate-fade-in-up rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-teal-600/25 motion-reduce:animate-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 md:p-8"
              style={{ animationDelay: `${160 + index * 80}ms` }}
            >
              <feature.Icon className="mb-4 size-6 text-teal-600" strokeWidth={1.75} aria-hidden="true" />
              <p className="text-base font-semibold tracking-wide text-teal-700">{feature.title}</p>
              <p className="mt-3 text-base leading-relaxed text-slate-600">{feature.body}</p>
            </li>
          ))}
        </ul>

        <div className="flex w-full max-w-lg flex-col items-center">
          <SettingsPanel locale={locale} settings={settings} onChange={onSettings} />
        </div>

        <div className="flex w-full max-w-xl flex-col items-center gap-3">
          <button
            type="button"
            onClick={onStart}
            disabled={starting}
            aria-busy={starting}
            className="cta-primary inline-flex min-h-[4.75rem] w-full items-center justify-center gap-3 rounded-2xl px-8 py-5 text-xl font-extrabold transition-colors duration-200 disabled:cursor-wait motion-reduce:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0D9488]"
          >
            {starting ? (
              <>
                <Loader2 className="size-5 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                {ui.awaitingPermission}
              </>
            ) : (
              <>
                <Play className="size-5 shrink-0 fill-current" strokeWidth={1.75} aria-hidden="true" />
                {ui.start}
              </>
            )}
          </button>
          {startError ? <p className="text-center text-sm text-slate-500">{ui.noCamera}</p> : null}
          <p className="max-w-md text-center text-sm leading-relaxed text-slate-500">{ui.startHint}</p>
        </div>
      </div>
    </section>
  );
}
