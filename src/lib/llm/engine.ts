import { generateWithGemini } from "@/lib/llm/gemini";
import { generateWithOpenAi } from "@/lib/llm/openai";
import { localFallback } from "@/lib/prompts";
import { hasGeminiKey, resolveActiveLlm } from "@/lib/llm/resolve";
import type { GenerateResult, Locale } from "@/types";

export async function generateSentence(
  keywords: string[],
  locale: Locale,
  override?: unknown,
): Promise<GenerateResult> {
  const engine = resolveActiveLlm(override);

  if (engine === "openai") {
    try {
      return { sentence: await generateWithOpenAi(keywords, locale), source: "openai" };
    } catch {
      // Credit / quota bittiğinde ücretli OpenAI'ye yapışma; ücretsiz Gemini veya yerel yedek.
      if (hasGeminiKey()) {
        try {
          return { sentence: await generateWithGemini(keywords, locale), source: "gemini" };
        } catch {
          /* local below */
        }
      }
      return { sentence: localFallback(keywords, locale), source: "fallback" };
    }
  }

  try {
    return { sentence: await generateWithGemini(keywords, locale), source: "gemini" };
  } catch {
    return { sentence: localFallback(keywords, locale), source: "fallback" };
  }
}
