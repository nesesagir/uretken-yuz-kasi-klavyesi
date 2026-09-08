import { getLiveAlert } from "@/lib/live-alert-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ alert: getLiveAlert() });
}
