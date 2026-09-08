import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    webhookConfigured: Boolean(process.env.CAREGIVER_WEBHOOK_URL),
  });
}
