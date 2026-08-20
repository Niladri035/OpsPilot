import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "opspilot-product",
    timestamp: new Date().toISOString(),
  });
}