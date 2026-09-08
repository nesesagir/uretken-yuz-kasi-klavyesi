import { extractSentence } from "@/lib/llm/parse";
import { EN_SYSTEM_PROMPT, TR_SYSTEM_PROMPT, userPrompt } from "@/lib/prompts";
import type { Locale } from "@/types";

export async function generateWithGemini(
  keywords: string[],
  locale: Locale,
): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("NO_GEMINI_KEY");

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const system = locale === "tr" ? TR_SYSTEM_PROMPT : EN_SYSTEM_PROMPT;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: userPrompt(keywords, locale) }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 120,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: { sentence: { type: "STRING" } },
          required: ["sentence"],
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`GEMINI_${response.status}`);
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text =
    data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  const sentence = extractSentence(text);
  if (!sentence) throw new Error("EMPTY");
  return sentence;
}
