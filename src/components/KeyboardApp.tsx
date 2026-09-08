"use client";

import { CalibrationCard } from "@/components/CalibrationCard";
import { CameraPanel } from "@/components/CameraPanel";
import { EmergencyOverlay } from "@/components/EmergencyOverlay";
import { Header } from "@/components/Header";
import { HeroScreen } from "@/components/HeroScreen";
import { IntentBar } from "@/components/IntentBar";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SentenceStage } from "@/components/SentenceStage";
import { SessionProtocol } from "@/components/SessionProtocol";
import { SettingsPanel } from "@/components/SettingsPanel";
import { SiteFooter } from "@/components/SiteFooter";
import { SleepCard } from "@/components/SleepCard";
import { SleepOverlay } from "@/components/SleepOverlay";
import { SosOverlay } from "@/components/SosOverlay";
import { WordGrid } from "@/components/WordGrid";
import { useFacePipeline } from "@/hooks/useFacePipeline";
import { useScheduledVoiceNotes } from "@/hooks/useScheduledVoiceNotes";
import { useSessionKiosk } from "@/hooks/useSessionKiosk";
import { AlarmSynth } from "@/lib/alarm";
import { AnalyticsSession } from "@/lib/analytics";
import { publishEmergency } from "@/lib/browser-notify";
import { appendCareJournal } from "@/lib/care-journal";
import { CARE_PROFILE_KEY, loadCareProfile } from "@/lib/care-profile";
import { buildGrid, getDaypart } from "@/lib/context-aware";
import { t } from "@/lib/copy";
import { defaultClinicalSettings, loadClinicalSettings, saveClinicalSettings } from "@/lib/settings";
import { silenceSpeech, speak, warmVoices } from "@/lib/speech";
import { loadVocabPrefs, VOCAB_PREFS_KEY, VOCAB_UPDATE_EVENT } from "@/lib/vocab-prefs";
import type {
  ClinicalSettings,
  EmergencyState,
  GenerateResult,
  GridCell,
  LlmId,
  Locale,
  SentenceAnalytics,
  SosState,
} from "@/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const idleEmergency: EmergencyState = {
  phase: "idle",
  patternCount: 0,
  graceRemainingMs: 0,
};

const idleSos: SosState = { active: false, reason: null };

const alarm = new AlarmSynth();
const analytics = new AnalyticsSession();

function formatClock(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function KeyboardApp() {
  const [locale, setLocale] = useState<Locale>("tr");
  const [provider, setProvider] = useState<LlmId>("gemini");
  const [started, setStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [focusIndex, setFocusIndex] = useState(0);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [sentence, setSentence] = useState("");
  const [source, setSource] = useState<GenerateResult["source"] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [emergency, setEmergency] = useState<EmergencyState>(idleEmergency);
  const [sos, setSos] = useState<SosState>(idleSos);
  const [alarmNotified, setAlarmNotified] = useState(false);
  const [sosNotified, setSosNotified] = useState(false);
  const [lastAnalytics, setLastAnalytics] = useState<SentenceAnalytics | null>(null);
  const [openaiReady, setOpenaiReady] = useState(false);
  const [settings, setSettings] = useState<ClinicalSettings>(() => defaultClinicalSettings());
  const [sleeping, setSleeping] = useState(false);
  const [gridArmed, setGridArmed] = useState(false);
  const [protocolOpen, setProtocolOpen] = useState(false);
  const [vocabTick, setVocabTick] = useState(0);
  const [carePhone, setCarePhone] = useState("");

  const focusRef = useRef(0);
  const cellsRef = useRef<GridCell[]>([]);
  const keywordsRef = useRef<string[]>([]);
  const localeRef = useRef(locale);
  const providerRef = useRef(provider);
  const emergencyRef = useRef(emergency);
  const sosRef = useRef(sos);
  const sleepingRef = useRef(sleeping);
  const sentenceRef = useRef(sentence);
  const lastSpokenRef = useRef("");
  const generatingRef = useRef(false);
  const startingRef = useRef(false);
  const generateAbortRef = useRef<AbortController | null>(null);
  const generateSeqRef = useRef(0);
  const speakTimerRef = useRef(0);
  const scanDueRef = useRef(0);
  const protocolOpenRef = useRef(false);

  const daypart = getDaypart(now);
  const cells = useMemo(() => buildGrid(daypart, loadVocabPrefs()), [daypart, vocabTick]);
  const ui = t(locale);
  const { fullscreen, enterFullscreen, toggleFullscreen } = useSessionKiosk(started);

  focusRef.current = focusIndex;
  cellsRef.current = cells;
  keywordsRef.current = keywords;
  localeRef.current = locale;
  providerRef.current = provider;
  emergencyRef.current = emergency;
  sosRef.current = sos;
  sleepingRef.current = sleeping;
  sentenceRef.current = sentence;
  generatingRef.current = generating;
  protocolOpenRef.current = protocolOpen;

  useEffect(() => {
    setSettings(loadClinicalSettings());
    setCarePhone(loadCareProfile().caregiverPhone);
  }, []);

  useEffect(() => {
    function refreshPhone() {
      setCarePhone(loadCareProfile().caregiverPhone);
    }
    function onStorage(event: StorageEvent) {
      if (event.key === CARE_PROFILE_KEY || event.key === null) refreshPhone();
      if (event.key === VOCAB_PREFS_KEY || event.key === null) setVocabTick((n) => n + 1);
    }
    function onVocab() {
      setVocabTick((n) => n + 1);
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("uykk-care-update", refreshPhone);
    window.addEventListener(VOCAB_UPDATE_EVENT, onVocab);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("uykk-care-update", refreshPhone);
      window.removeEventListener(VOCAB_UPDATE_EVENT, onVocab);
    };
  }, []);

  function updateSettings(next: ClinicalSettings) {
    setSettings(next);
    saveClinicalSettings(next);
  }

  useEffect(() => {
    void fetch("/api/config")
      .then((response) => response.json())
      .then((data: { activeLlm?: string; openaiReady?: boolean }) => {
        setOpenaiReady(Boolean(data.openaiReady));
        if (data.openaiReady && data.activeLlm === "openai") {
          setProvider("openai");
          return;
        }
        setProvider("gemini");
      })
      .catch(() => undefined);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.clearTimeout(speakTimerRef.current);
    setSpeaking(false);
    silenceSpeech();
  }, []);

  const startSpeaking = useCallback((text: string) => {
    window.clearTimeout(speakTimerRef.current);
    setSpeaking(true);
    speak(text, localeRef.current);
    speakTimerRef.current = window.setTimeout(() => setSpeaking(false), 2500);
  }, []);

  const abortGenerate = useCallback(() => {
    generateSeqRef.current += 1;
    generateAbortRef.current?.abort();
    generateAbortRef.current = null;
    generatingRef.current = false;
    setGenerating(false);
  }, []);

  const runGenerate = useCallback(async () => {
    const selected = keywordsRef.current;
    if (!selected.length || generatingRef.current) return;
    generateAbortRef.current?.abort();
    const controller = new AbortController();
    generateAbortRef.current = controller;
    const seq = ++generateSeqRef.current;
    analytics.count();
    analytics.markRequest();
    setGenerating(true);
    generatingRef.current = true;
    const timeout = window.setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          keywords: selected,
          locale: localeRef.current,
          provider: providerRef.current,
        }),
      });
      const data = (await response.json()) as GenerateResult;
      if (seq !== generateSeqRef.current) return;
      setSentence(data.sentence);
      setSource(data.source);
      sentenceRef.current = data.sentence;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setLastAnalytics(analytics.commit(data.source, selected.length));
        });
      });
      if (data.sentence) {
        lastSpokenRef.current = data.sentence;
        startSpeaking(data.sentence);
        appendCareJournal({
          kind: "sentence",
          text: data.sentence,
          keywords: selected,
          locale: localeRef.current,
        });
        keywordsRef.current = [];
        setKeywords([]);
        setFocusIndex(1);
      }
    } catch (error) {
      if (seq !== generateSeqRef.current) return;
      if (error instanceof DOMException && error.name === "AbortError") return;
      setSentence("");
    } finally {
      window.clearTimeout(timeout);
      if (seq !== generateSeqRef.current) return;
      setGenerating(false);
      generatingRef.current = false;
    }
  }, [startSpeaking]);

  const activateIndex = useCallback(
    (index: number) => {
      const cell = cellsRef.current[index];
      if (!cell) return;
      if (cell.kind === "word") {
        const label = cell.word[localeRef.current];
        const prev = keywordsRef.current;
        if (prev.includes(label) || prev.length >= 6) return;
        abortGenerate();
        analytics.count();
        const next = [...prev, label];
        keywordsRef.current = next;
        setKeywords(next);
        return;
      }
      if (cell.action === "delete") {
        abortGenerate();
        analytics.count();
        const next = keywordsRef.current.slice(0, -1);
        keywordsRef.current = next;
        setKeywords(next);
        return;
      }
      if (cell.action === "clear") {
        abortGenerate();
        stopSpeaking();
        analytics.abandon();
        keywordsRef.current = [];
        setKeywords([]);
        setSentence("");
        setSource(null);
        setLastAnalytics(null);
        sentenceRef.current = "";
        setFocusIndex(1);
        return;
      }
      if (cell.action === "repeat") {
        if (lastSpokenRef.current) startSpeaking(lastSpokenRef.current);
        return;
      }
      if (cell.action === "generate") {
        void runGenerate();
      }
    },
    [abortGenerate, runGenerate, startSpeaking, stopSpeaking],
  );

  const removeKeywordAt = useCallback(
    (index: number) => {
      abortGenerate();
      analytics.count();
      const next = keywordsRef.current.filter((_, i) => i !== index);
      keywordsRef.current = next;
      setKeywords(next);
    },
    [abortGenerate],
  );

  const stopAlarmRef = useRef<() => void>(() => {});

  const onSelect = useCallback(() => {
    if (emergencyRef.current.phase === "grace" || emergencyRef.current.phase === "alarm" || sosRef.current.active) {
      return;
    }
    if (sleepingRef.current) {
      setSleeping(false);
      setFocusIndex(1);
      return;
    }
    if (focusRef.current === 0) {
      setSleeping(true);
      return;
    }
    activateIndex(focusRef.current - 1);
  }, [activateIndex]);

  const wake = useCallback(() => {
    setSleeping(false);
    setFocusIndex(1);
  }, []);
  const rest = useCallback(() => setSleeping(true), []);

  const {
    videoRef,
    canvasRef,
    phase,
    error,
    metrics,
    baselineProgress,
    cancelEmergency,
    cancelSos,
    injectLongBlink,
    injectSos,
  } = useFacePipeline({
    active: started,
    triggerMode: settings.triggerMode,
    sleeping,
    onSelect,
    onSleep: rest,
    onWake: wake,
    onFailSafeChange: setEmergency,
    onSosChange: setSos,
    onSafetyCancel: () => stopAlarmRef.current(),
  });

  useEffect(() => {
    if (!started) {
      setGridArmed(false);
      return;
    }
    if (phase === "live" || phase === "error") setGridArmed(true);
  }, [started, phase]);

  const sessionReady = gridArmed || phase === "live" || phase === "error";

  useScheduledVoiceNotes(
    locale,
    sos.active || emergency.phase === "grace" || emergency.phase === "alarm",
  );

  const handleCancelEmergency = useCallback(() => {
    alarm.stop();
    silenceSpeech();
    cancelEmergency();
    cancelSos();
    setAlarmNotified(false);
    setSosNotified(false);
  }, [cancelEmergency, cancelSos]);

  stopAlarmRef.current = handleCancelEmergency;

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    scanDueRef.current = 0;
  }, [settings.scanMs, sleeping]);

  useEffect(() => {
    const paused =
      !started ||
      !sessionReady ||
      emergency.phase === "grace" ||
      emergency.phase === "alarm" ||
      sos.active ||
      sleeping;
    if (paused) return;
    const id = window.setInterval(() => {
      const nowMs = performance.now();
      if (scanDueRef.current === 0) scanDueRef.current = nowMs + settings.scanMs;
      if (nowMs < scanDueRef.current) return;
      scanDueRef.current = nowMs + settings.scanMs;
      setFocusIndex((index) => (index + 1) % (cellsRef.current.length + 1));
    }, 50);
    return () => window.clearInterval(id);
  }, [started, sessionReady, emergency.phase, sos.active, sleeping, settings.scanMs]);

  useEffect(() => {
    if (emergency.phase !== "alarm" || alarmNotified) return;
    setAlarmNotified(true);
    void alarm.start();
    appendCareJournal({
      kind: "alarm",
      text: t(locale).alarmTitle,
      locale,
    });
    publishEmergency("alarm", t(locale).alarmTitle, t(locale).alarmBody);
    void fetch("/api/emergency", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale,
        at: new Date().toISOString(),
        trigger: "long-blink-pattern",
        event: "alarm",
        text: t(locale).alarmTitle,
      }),
    });
  }, [emergency.phase, alarmNotified, locale]);

  useEffect(() => {
    if (!sos.active || sosNotified) return;
    setSosNotified(true);
    void alarm.start();
    speak(`${ui.sosBreath} ${ui.sosSwallow}`, locale);
    appendCareJournal({
      kind: "sos",
      text: `${ui.sosBreath} ${ui.sosSwallow}`,
      locale,
    });
    publishEmergency("sos", ui.sosTitle, `${ui.sosBreath} ${ui.sosSwallow}`);
    void fetch("/api/emergency", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale,
        at: new Date().toISOString(),
        trigger: sos.reason ?? "sos",
        event: "sos",
        text: `${ui.sosBreath} ${ui.sosSwallow}`,
      }),
    });
  }, [sos.active, sos.reason, sosNotified, locale, ui.sosBreath, ui.sosSwallow]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (protocolOpenRef.current) {
        if (event.code === "Escape") {
          event.preventDefault();
          setProtocolOpen(false);
        }
        return;
      }
      if (!started) return;
      if (event.code === "Space") {
        event.preventDefault();
        onSelect();
      }
      if (event.code === "Escape") {
        handleCancelEmergency();
      }
      if (event.code === "KeyE" && event.shiftKey) {
        event.preventDefault();
        injectSos();
        return;
      }
      if (event.code === "KeyE" && !sleepingRef.current) {
        event.preventDefault();
        injectLongBlink();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleCancelEmergency, injectLongBlink, injectSos, onSelect, started]);

  async function start() {
    if (startingRef.current || started) return;
    startingRef.current = true;
    setStarting(true);
    setStartError(false);
    setCarePhone(loadCareProfile().caregiverPhone);
    warmVoices();
    await alarm.unlock();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    setStarted(true);
  }

  async function confirmProtocol(opts: { fullscreen: boolean }) {
    setProtocolOpen(false);
    if (opts.fullscreen) await enterFullscreen();
    await start();
  }

  const gridFocus = focusIndex === 0 ? -1 : focusIndex - 1;

  useEffect(() => {
    if (!started) return;
    const toTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };
    toTop();
    const frame = window.requestAnimationFrame(() => {
      toTop();
      window.requestAnimationFrame(toTop);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [started, sessionReady]);

  const camera = (
    <CameraPanel
      locale={locale}
      phase={error ? "error" : phase}
      metrics={metrics}
      patternCount={emergency.patternCount}
      videoRef={videoRef}
      canvasRef={canvasRef}
      error={error}
      showMeters={sessionReady}
    />
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <Header
        locale={locale}
        daypart={daypart}
        clock={formatClock(now)}
        provider={provider}
        compact={started}
        showLlmToggle={openaiReady}
        fullscreen={fullscreen}
        onLocale={setLocale}
        onProvider={setProvider}
        onFullscreen={started ? () => void toggleFullscreen() : undefined}
      />

      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-5 px-4 py-4 md:px-6 md:py-5">

        {!started ? (
          <HeroScreen
            locale={locale}
            starting={starting}
            startError={startError}
            settings={settings}
            onSettings={updateSettings}
            onStart={() => setProtocolOpen(true)}
          />
        ) : (
          <main
            className={
              sessionReady
                ? "grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-[minmax(240px,0.9fr)_minmax(0,1.25fr)]"
                : "mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col items-center justify-start gap-6 py-6"
            }
          >
            <div className={sessionReady ? "grid min-h-0 gap-3" : "w-full"}>
              {camera}
              {sessionReady ? (
                <SettingsPanel
                  locale={locale}
                  settings={settings}
                  compact
                  onChange={updateSettings}
                />
              ) : null}
            </div>

            {sessionReady ? (
              <div className="relative grid min-h-0 grid-rows-[auto_auto_auto_1fr] gap-3">
                {!sleeping ? (
                  <SleepCard
                    locale={locale}
                    focused={focusIndex === 0}
                    scanMs={settings.scanMs}
                    onSelect={rest}
                  />
                ) : null}
                <div className={sleeping ? "pointer-events-none blur-sm opacity-40" : ""}>
                  <div className="grid gap-3">
                    <IntentBar
                      locale={locale}
                      keywords={keywords}
                      emptyHint={settings.triggerMode === "jaw" ? ui.intentEmptyJaw : ui.intentEmpty}
                      onRemove={removeKeywordAt}
                    />
                    <SentenceStage
                      locale={locale}
                      sentence={sentence}
                      source={source}
                      generating={generating}
                      speaking={speaking}
                      analytics={lastAnalytics}
                    />
                    <WordGrid
                      locale={locale}
                      cells={cells}
                      focusIndex={gridFocus}
                      generateReady={keywords.length >= 1}
                      scanMs={settings.scanMs}
                      onCell={activateIndex}
                    />
                  </div>
                </div>
                {sleeping ? <SleepOverlay locale={locale} onWake={wake} /> : null}
              </div>
            ) : (
              <CalibrationCard locale={locale} phase={error ? "error" : phase} progress={baselineProgress} />
            )}
          </main>
        )}

        {started && sessionReady ? (
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {[
              settings.triggerMode === "jaw" ? ui.jawHint : ui.blink,
              ui.space,
              ui.longBlink,
              ui.esc,
              ui.sleepTitle,
            ].map((hint) => (
              <span key={hint} className="rounded-full border border-slate-200 bg-white px-3 py-1">
                {hint}
              </span>
            ))}
            {error ? (
              <span className="rounded-full border border-teal-600/25 bg-teal-50 px-3 py-1 text-teal-800">{ui.noCamera}</span>
            ) : null}
          </div>
        ) : null}
      </div>

      <SiteFooter locale={locale} />

      <ScrollToTop locale={locale} />
      {sos.active ? (
        <SosOverlay locale={locale} state={sos} phone={carePhone} onCancel={handleCancelEmergency} />
      ) : (
        <EmergencyOverlay locale={locale} state={emergency} phone={carePhone} onCancel={handleCancelEmergency} />
      )}
      {protocolOpen && !started ? (
        <SessionProtocol
          locale={locale}
          settings={settings}
          onCancel={() => setProtocolOpen(false)}
          onConfirm={(opts) => void confirmProtocol(opts)}
        />
      ) : null}
    </div>
  );
}
