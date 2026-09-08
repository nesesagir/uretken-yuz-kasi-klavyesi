"use client";

import { CaregiverCallButton } from "@/components/CaregiverCallButton";
import { SessionSummarySheet } from "@/components/SessionSummarySheet";
import { VocabPrefsEditor } from "@/components/VocabPrefsEditor";
import { subscribeEmergency } from "@/lib/browser-notify";
import { CARE_JOURNAL_KEY, clearCareJournal, loadCareJournal } from "@/lib/care-journal";
import {
  addCareNote,
  CARE_NOTES_KEY,
  CARE_PROFILE_KEY,
  defaultCareProfile,
  formatNoteSchedule,
  loadCareNotes,
  loadCareProfile,
  localDateKey,
  removeCareNote,
  saveCareProfile,
  sanitizeCareName,
  sanitizeCarePhone,
  updateCareNote,
} from "@/lib/care-profile";
import { t } from "@/lib/copy";
import type { LiveAlert } from "@/lib/live-alert-store";
import { buildSessionSummary } from "@/lib/session-summary";
import { speak, warmVoices } from "@/lib/speech";
import type { CareJournalEntry, CareJournalKind, CareProfile, CareVoiceNote, Locale } from "@/types";
import { useEffect, useMemo, useState } from "react";

type Filter = "all" | "sentence" | "alert" | "note";

function formatDay(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleTimeString(locale === "tr" ? "tr-TR" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function kindLabel(kind: CareJournalKind, locale: Locale): string {
  const ui = t(locale);
  if (kind === "sentence") return ui.careKindSentence;
  if (kind === "sos") return ui.careKindSos;
  if (kind === "note") return ui.careKindNote;
  return ui.careKindAlarm;
}

function kindTone(kind: CareJournalKind): string {
  if (kind === "sos" || kind === "alarm") return "text-rose-700";
  if (kind === "note") return "text-slate-600";
  return "text-teal-700";
}

const fieldClass =
  "mt-1 w-full rounded-md border border-slate-200 bg-[#F8FAFB] px-3 py-2 text-[15px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-teal-600";

const sectionTitle = "text-[13px] font-semibold text-slate-900";

type Props = {
  locale: Locale;
};

export function CareJournalView({ locale }: Props) {
  const ui = t(locale);
  const [entries, setEntries] = useState<CareJournalEntry[]>([]);
  const [profile, setProfile] = useState<CareProfile>(defaultCareProfile);
  const [notes, setNotes] = useState<CareVoiceNote[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [draftText, setDraftText] = useState("");
  const [draftDate, setDraftDate] = useState("");
  const [draftTime, setDraftTime] = useState("09:00");
  const [nameFocus, setNameFocus] = useState<"user" | "giver" | "phone" | null>(null);
  const [live, setLive] = useState<LiveAlert | null>(null);
  const [webhookConfigured, setWebhookConfigured] = useState<boolean | null>(null);
  const [summaryTick, setSummaryTick] = useState(0);

  function refresh() {
    setEntries(loadCareJournal());
    setProfile(loadCareProfile());
    setNotes(loadCareNotes());
    setSummaryTick((n) => n + 1);
  }

  useEffect(() => {
    refresh();
    setDraftDate((current) => current || localDateKey());
    warmVoices();
    function onStorage(event: StorageEvent) {
      if (
        event.key === CARE_JOURNAL_KEY ||
        event.key === CARE_PROFILE_KEY ||
        event.key === CARE_NOTES_KEY ||
        event.key === null
      ) {
        refresh();
      }
    }
    function onLocal() {
      refresh();
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("uykk-care-update", onLocal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("uykk-care-update", onLocal);
    };
  }, []);

  useEffect(() => {
    void fetch("/api/config")
      .then((response) => response.json())
      .then((data: { webhookConfigured?: boolean }) => {
        setWebhookConfigured(Boolean(data.webhookConfigured));
      })
      .catch(() => setWebhookConfigured(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const response = await fetch("/api/live-alert", { cache: "no-store" });
        const data = (await response.json()) as { alert?: LiveAlert | null };
        if (!cancelled) setLive(data.alert ?? null);
      } catch {
        /* panel stays usable without the live channel */
      }
    }
    void tick();
    const id = window.setInterval(() => void tick(), 4000);
    const unsubscribe = subscribeEmergency((event) => {
      setLive({ kind: event.kind, text: event.body || event.title, at: Date.now() });
    });
    return () => {
      cancelled = true;
      window.clearInterval(id);
      unsubscribe();
    };
  }, []);

  const summary = useMemo(() => buildSessionSummary(locale), [locale, entries, profile, summaryTick]);

  const visible = useMemo(() => {
    const filtered =
      filter === "all"
        ? entries
        : filter === "sentence"
          ? entries.filter((row) => row.kind === "sentence")
          : filter === "note"
            ? entries.filter((row) => row.kind === "note")
            : entries.filter((row) => row.kind === "sos" || row.kind === "alarm");
    return [...filtered].reverse();
  }, [entries, filter]);

  const scheduledNotes = useMemo(
    () =>
      [...notes].sort((a, b) => {
        const left = `${a.date ?? "0000-01-01"}T${String(a.hour).padStart(2, "0")}:${String(a.minute).padStart(2, "0")}`;
        const right = `${b.date ?? "0000-01-01"}T${String(b.hour).padStart(2, "0")}:${String(b.minute).padStart(2, "0")}`;
        return left.localeCompare(right);
      }),
    [notes],
  );

  const groups = useMemo(() => {
    const map = new Map<string, CareJournalEntry[]>();
    for (const row of visible) {
      const key = formatDay(row.at, locale);
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [visible, locale]);

  function onProfile(next: CareProfile) {
    setProfile(next);
    saveCareProfile(next);
  }

  function onClear() {
    if (!window.confirm(ui.careClearConfirm)) return;
    clearCareJournal();
    refresh();
  }

  function onAddNote() {
    const [hourRaw, minuteRaw] = draftTime.split(":");
    const created = addCareNote({
      text: draftText,
      date: draftDate || localDateKey(),
      hour: Number(hourRaw),
      minute: Number(minuteRaw),
    });
    if (!created) return;
    setDraftText("");
    refresh();
  }

  const tab = (id: Filter, label: string) => (
    <button
      type="button"
      onClick={() => setFilter(id)}
      aria-pressed={filter === id}
      className={`border-b-2 px-0.5 pb-2 text-sm transition-colors ${
        filter === id
          ? "border-teal-600 font-medium text-slate-900"
          : "border-transparent text-slate-500 hover:text-slate-800"
      }`}
    >
      {label}
    </button>
  );

  return (
    <article className="surface mx-auto w-full max-w-3xl rounded-2xl px-6 py-7 md:px-8 md:py-8">
      <h1 className="hero-title no-print m-0 text-[1.65rem] font-semibold tracking-tight text-slate-900 md:text-[1.85rem]">
        {ui.care}
      </h1>

      {live ? (
        <div className="no-print mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-950" role="alert">
          <p className="m-0 text-[11px] font-medium uppercase tracking-[0.16em] text-rose-700">{ui.liveAlertTitle}</p>
          <p className="mt-1 text-base font-semibold">
            {live.kind === "sos" ? ui.careKindSos : ui.careKindAlarm}
          </p>
          {live.text ? <p className="mt-1 text-sm text-rose-800">{live.text}</p> : null}
          <CaregiverCallButton locale={locale} phone={profile.caregiverPhone} variant="panel" />
        </div>
      ) : null}

      <section className="no-print mt-6">
        <div className="grid grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label htmlFor="care-user-name" className="text-[13px] font-medium text-slate-600">
              {ui.userNameLabel}
            </label>
            <input
              id="care-user-name"
              type="text"
              autoComplete="off"
              maxLength={40}
              value={profile.userName}
              placeholder={nameFocus === "user" ? undefined : ui.userNamePlaceholder}
              onFocus={() => setNameFocus("user")}
              onBlur={() => setNameFocus(null)}
              onChange={(event) =>
                onProfile({ ...profile, userName: sanitizeCareName(event.target.value) })
              }
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="care-giver-name" className="text-[13px] font-medium text-slate-600">
              {ui.caregiverNameLabel}
            </label>
            <input
              id="care-giver-name"
              type="text"
              autoComplete="off"
              maxLength={40}
              value={profile.caregiverName}
              placeholder={nameFocus === "giver" ? undefined : ui.caregiverNamePlaceholder}
              onFocus={() => setNameFocus("giver")}
              onBlur={() => setNameFocus(null)}
              onChange={(event) =>
                onProfile({ ...profile, caregiverName: sanitizeCareName(event.target.value) })
              }
              className={fieldClass}
            />
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="care-giver-phone" className="text-[13px] font-medium text-slate-600">
            {ui.caregiverPhoneLabel}
          </label>
          <input
            id="care-giver-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={16}
            value={profile.caregiverPhone}
            placeholder={nameFocus === "phone" ? undefined : ui.caregiverPhonePlaceholder}
            onFocus={() => setNameFocus("phone")}
            onBlur={() => setNameFocus(null)}
            onChange={(event) =>
              onProfile({ ...profile, caregiverPhone: sanitizeCarePhone(event.target.value) })
            }
            className={fieldClass}
          />
          <p className="mt-2 text-xs leading-relaxed text-slate-500">{ui.caregiverPhoneHint}</p>
          {webhookConfigured !== null ? (
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {webhookConfigured ? ui.webhookReady : ui.webhookMissing}
            </p>
          ) : null}
        </div>
      </section>

      <div className="no-print">
        <VocabPrefsEditor locale={locale} />
      </div>

      <section className="no-print mt-6 border-t border-slate-200 pt-6">
        <h2 className={sectionTitle}>{ui.notesTitle}</h2>
        <form
          className="mt-4 flex flex-col gap-3 sm:grid sm:grid-cols-[1fr_auto] sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            onAddNote();
          }}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_11rem_7.5rem]">
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="care-note-text" className="text-[13px] font-medium text-slate-600">
                {ui.notesTextLabel}
              </label>
              <input
                id="care-note-text"
                type="text"
                maxLength={280}
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="care-note-date" className="text-[13px] font-medium text-slate-600">
                {ui.notesDateLabel}
              </label>
              <input
                id="care-note-date"
                type="date"
                value={draftDate}
                onChange={(event) => setDraftDate(event.target.value || localDateKey())}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="care-note-time" className="text-[13px] font-medium text-slate-600">
                {ui.notesTimeLabel}
              </label>
              <input
                id="care-note-time"
                type="time"
                value={draftTime}
                onChange={(event) => setDraftTime(event.target.value || "09:00")}
                className={fieldClass}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!draftText.trim() || !draftDate}
            className="inline-flex min-h-10 w-fit items-center justify-center rounded-lg bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-40"
          >
            {ui.notesAdd}
          </button>
        </form>

        {scheduledNotes.length === 0 ? null : (
          <ul className="mt-5 divide-y divide-slate-200 border-t border-slate-200">
            {scheduledNotes.map((note) => (
              <li key={note.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="m-0 text-sm font-medium tabular-nums text-slate-900">
                    {formatNoteSchedule(note, locale)}
                  </p>
                  <p className="mt-0.5 text-sm leading-snug text-slate-600">{note.text}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-1.5 text-sm text-slate-500">
                    <input
                      type="checkbox"
                      className="accent-teal-600"
                      checked={note.enabled}
                      onChange={(event) => {
                        updateCareNote(note.id, { enabled: event.target.checked });
                        refresh();
                      }}
                    />
                    {ui.notesEnabled}
                  </label>
                  <button
                    type="button"
                    className="text-sm font-medium text-teal-800 hover:underline"
                    onClick={() => speak(note.text, locale)}
                  >
                    {ui.notesPlay}
                  </button>
                  <button
                    type="button"
                    className="text-sm font-medium text-slate-500 hover:text-slate-800 hover:underline"
                    onClick={() => {
                      removeCareNote(note.id);
                      refresh();
                    }}
                  >
                    {ui.notesDelete}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <SessionSummarySheet locale={locale} summary={summary} />

      <section className="no-print mt-6 border-t border-slate-200 pt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className={sectionTitle}>{ui.careRecords}</h2>
          {entries.length ? (
            <button
              type="button"
              onClick={onClear}
              className="no-print text-sm text-slate-500 hover:text-slate-800 hover:underline"
            >
              {ui.careClear}
            </button>
          ) : null}
        </div>
        <div className="no-print mt-4 flex flex-wrap gap-5 border-b border-slate-200">
          {tab("all", ui.careAll)}
          {tab("sentence", ui.careSentences)}
          {tab("note", ui.careNotesFilter)}
          {tab("alert", ui.careAlerts)}
        </div>

        {visible.length === 0 ? (
          <p className="m-0 py-5 text-sm text-slate-500">{ui.careEmpty}</p>
        ) : (
          <div className="mt-2 divide-y divide-slate-200">
            {groups.map(([day, rows]) => (
              <div key={day} className="py-5">
                <h3 className="mb-3 text-[13px] font-medium text-slate-500">{day}</h3>
                <ul className="grid gap-4">
                  {rows.map((row) => (
                    <li key={row.id}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className={`text-[13px] font-medium ${kindTone(row.kind)}`}>
                          {kindLabel(row.kind, locale)}
                        </span>
                        <time className="tabular-nums text-sm text-slate-500" dateTime={row.at}>
                          {formatTime(row.at, locale)}
                        </time>
                      </div>
                      <p className="mt-1 text-[15px] leading-relaxed text-slate-900">{row.text}</p>
                      {row.keywords?.length ? (
                        <p className="mt-1 text-sm text-slate-500">{row.keywords.join(" · ")}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </article>
  );
}
