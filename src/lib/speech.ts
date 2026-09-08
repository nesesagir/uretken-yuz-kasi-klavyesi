import type { Locale } from "@/types";

function pickVoice(locale: Locale): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const prefix = locale === "tr" ? "tr" : "en";
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix)) ?? null
  );
}

export function warmVoices(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

export function speak(text: string, locale: Locale): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale === "tr" ? "tr-TR" : "en-US";
  utterance.rate = 0.92;
  utterance.pitch = 1;
  const voice = pickVoice(locale);
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

export function silenceSpeech(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  try {
    window.speechSynthesis.resume();
  } catch {
    /* Chrome can freeze the engine after cancel() */
  }
}
