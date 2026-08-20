import { NextResponse } from "next/server";
import { getCurrentWorkspace } from "@/lib/workspace";
import { runWorkspaceMonitorChecks } from "@/lib/monitor";

export async function POST() {
  const workspace = await getCurrentWorkspace();

  if (!workspace) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const result = await runWorkspaceMonitorChecks(workspace.id, true);

  return NextResponse.json(result);
}