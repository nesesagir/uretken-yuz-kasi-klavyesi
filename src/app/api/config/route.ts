import { NextResponse } from "next/server";
import { hasGeminiKey, hasOpenAiKey, resolveActiveLlm } from "@/lib/llm/resolve";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    activeLlm: resolveActiveLlm(),
    openaiReady: hasOpenAiKey(),
    geminiReady: hasGeminiKey(),
    webhookConfigured: Boolean(process.env.CAREGIVER_WEBHOOK_URL),
  });
}
