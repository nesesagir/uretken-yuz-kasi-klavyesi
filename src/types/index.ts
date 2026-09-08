export type Locale = "tr" | "en";

export type Daypart = "morning" | "afternoon" | "evening" | "night";

export type TriggerMode = "jaw" | "blink";

export type LlmSource = "gemini" | "fallback";

export type Point = {
  x: number;
  y: number;
  z?: number;
};

export type FaceMetrics = {
  openness: number;
  opennessScaled: number;
  jawScore: number;
  jawScaled: number;
  eyelidRaise: number;
  faceWidth: number;
  fps: number;
  blinking: boolean;
  clenching: boolean;
  baselineReady: boolean;
};

export type PipelinePhase =
  | "idle"
  | "requesting-camera"
  | "loading-model"
  | "awaiting-face"
  | "calibrating"
  | "live"
  | "error";

export type EmergencyPhase = "idle" | "armed" | "grace" | "alarm";

export type EmergencyState = {
  phase: EmergencyPhase;
  /** Count of long blinks currently inside the 6s window (0–3). */
  patternCount: number;
  graceRemainingMs: number;
};

export type SosReason = "eyelid-raise" | "jaw-hold";

export type SosState = {
  active: boolean;
  reason: SosReason | null;
};

export type ClinicalSettings = {
  triggerMode: TriggerMode;
  scanMs: number;
};

export type Word = {
  id: string;
  tr: string;
  en: string;
  category: "core" | "need" | "comfort" | "social" | "meal";
  weights: Record<Daypart, number>;
};

export type GridCell =
  | { kind: "word"; word: Word }
  | { kind: "action"; action: ActionId; tr: string; en: string };

export type ActionId = "generate" | "delete" | "clear" | "repeat";

export type GenerateResult = {
  sentence: string;
  source: LlmSource;
};

export type CareJournalKind = "sentence" | "sos" | "alarm" | "note";

export type CareJournalEntry = {
  id: string;
  at: string;
  kind: CareJournalKind;
  text: string;
  keywords?: string[];
  locale?: Locale;
};

export type CareProfile = {
  userName: string;
  caregiverName: string;
  caregiverPhone: string;
};

export type CustomContextWord = {
  id: string;
  tr: string;
  en: string;
};

export type VocabPrefs = {
  selectedIds: string[];
  custom: CustomContextWord[];
};

export type CareVoiceNote = {
  id: string;
  text: string;
  date?: string;
  hour: number;
  minute: number;
  enabled: boolean;
  lastSpokenOn: string | null;
};

export type BlinkKind = "short" | "long";

export type BlinkEvent = {
  kind: BlinkKind;
  durationMs: number;
};
