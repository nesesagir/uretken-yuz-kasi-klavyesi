import { NextResponse } from "next/server";
import { generateSentence } from "@/lib/llm/engine";
import type { Locale } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 20;

const MAX_KEYWORDS = 8;
const MAX_KEYWORD_LEN = 40;

function parseKeywords(input: unknown): string[] | null {
  if (!Array.isArray(input)) return null;
  const cleaned = input
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_KEYWORDS)
    .map((item) => item.slice(0, MAX_KEYWORD_LEN));
  return cleaned.length ? cleaned : [];
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const record = body as { keywords?: unknown; locale?: unknown };
  const keywords = parseKeywords(record.keywords);
  const locale: Locale = record.locale === "en" ? "en" : "tr";

  if (!keywords) {
    return NextResponse.json({ error: "invalid_keywords" }, { status: 400 });
  }

  const payload = await generateSentence(keywords, locale);
  return NextResponse.json(payload);
}
