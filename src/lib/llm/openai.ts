import { extractSentence } from "@/lib/llm/parse";
import { EN_SYSTEM_PROMPT, SENTENCE_JSON_SCHEMA, TR_SYSTEM_PROMPT, userPrompt } from "@/lib/prompts";
import type { Locale } from "@/types";

export async function generateWithOpenAi(
  keywords: string[],
  locale: Locale,
): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("NO_OPENAI_KEY");

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const system = locale === "tr" ? TR_SYSTEM_PROMPT : EN_SYSTEM_PROMPT;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 120,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt(keywords, locale) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: SENTENCE_JSON_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`OPENAI_${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content ?? "";
  const sentence = extractSentence(text);
  if (!sentence) throw new Error("EMPTY");
  return sentence;
}
