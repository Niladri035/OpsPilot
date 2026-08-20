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

  const monitors = await prisma.monitor.findMany({
    where: {
      workspaceId: workspace.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      incidents: {
        where: {
          status: {
            notIn: ["RESOLVED", "CLOSED"],
          },
        },
        select: {
          id: true,
        },
      },
    },
  });

  return NextResponse.json({ monitors });
}

export async function POST(request: Request) {
  try {
    const workspace = await getCurrentWorkspace();

    if (!workspace) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const name = body.name?.trim();
    const url = body.url?.trim();
    const intervalSeconds = Number(body.intervalSeconds || 300);

    if (!name || !url) {
      return NextResponse.json(
        { error: "Monitor name and URL are required" },
        { status: 400 }
      );
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL. Use full URL like https://example.com" },
        { status: 400 }
      );
    }

    const monitor = await prisma.monitor.create({
      data: {
        workspaceId: workspace.id,
        name,
        url,
        intervalSeconds: Math.max(60, intervalSeconds),
      },
    });

    return NextResponse.json({ monitor });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create monitor" },
      { status: 500 }
    );
  }
}