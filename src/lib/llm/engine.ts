import { generateWithGemini } from "@/lib/llm/gemini";
import { localFallback } from "@/lib/prompts";
import type { GenerateResult, Locale } from "@/types";

export async function generateSentence(
  keywords: string[],
  locale: Locale,
): Promise<GenerateResult> {
  try {
    return { sentence: await generateWithGemini(keywords, locale), source: "gemini" };
  } catch {
    return { sentence: localFallback(keywords, locale), source: "fallback" };
  }
}
