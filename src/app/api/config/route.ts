import { NextResponse } from "next/server";
import { hasGeminiKey } from "@/lib/llm/resolve";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    geminiReady: hasGeminiKey(),
    webhookConfigured: Boolean(process.env.CAREGIVER_WEBHOOK_URL),
  });
}
