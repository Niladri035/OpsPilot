import { NextResponse } from "next/server";
import { getCurrentWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const workspace = await getCurrentWorkspace();

  if (!workspace) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const incidents = await prisma.incident.findMany({
    where: {
      workspaceId: workspace.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      monitor: {
        select: {
          name: true,
          url: true,
        },
      },
    },
  });

  return NextResponse.json({ incidents });
}