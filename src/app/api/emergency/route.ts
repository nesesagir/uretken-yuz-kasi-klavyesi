import { setLiveAlert } from "@/lib/live-alert-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export async function POST(request: Request) {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const record = asRecord(body);
  const kind = record.event === "sos" ? "sos" : "alarm";
  const rawText =
    typeof record.text === "string" && record.text.trim()
      ? record.text.trim()
      : typeof record.trigger === "string" && record.trigger.trim()
        ? record.trigger.trim()
        : kind;
  setLiveAlert(kind, rawText.slice(0, 200));

  const webhook = process.env.CAREGIVER_WEBHOOK_URL;
  const payload = {
    source: "uretken-yuz-kasi-klavyesi",
    event: kind === "sos" ? "sos" : "emergency",
    triggeredAt: new Date().toISOString(),
    body,
  };

  if (!webhook) {
    return NextResponse.json({ delivered: false, reason: "no_webhook", live: true });
  }

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return NextResponse.json({
      delivered: response.ok,
      status: response.status,
      live: true,
    });
  } catch {
    return NextResponse.json({ delivered: false, reason: "webhook_failed", live: true }, { status: 502 });
  }
}
