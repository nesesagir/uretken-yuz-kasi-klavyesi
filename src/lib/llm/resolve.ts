import type { LlmId } from "@/types";

export function hasOpenAiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

/** OpenAI is paid. Without an explicit key we never select it. */
export function resolveActiveLlm(override?: unknown): LlmId {
  if (override === "openai" && hasOpenAiKey()) return "openai";
  if (override === "gemini") return "gemini";
  const raw = (process.env.ACTIVE_LLM || "gemini").trim().toLowerCase();
  if (raw === "openai" && hasOpenAiKey()) return "openai";
  return "gemini";
}

