import { NextResponse } from "next/server";
import { runAllMonitorChecks } from "@/lib/monitor";

export async function POST(request: Request) {
  const cronSecret = request.headers.get("x-cron-secret");

  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 }
    );
  }

  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const result = await runAllMonitorChecks(false);

  return NextResponse.json({
    ok: true,
    result,
  });
}
