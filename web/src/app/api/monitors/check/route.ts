import { NextResponse } from "next/server";
import { getCurrentWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";

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
    const monitorId = body.monitorId;

    if (!monitorId) {
      return NextResponse.json(
        { error: "monitorId is required" },
        { status: 400 }
      );
    }

    const monitor = await prisma.monitor.findFirst({
      where: {
        id: monitorId,
        workspaceId: workspace.id,
      },
    });

    if (!monitor) {
      return NextResponse.json(
        { error: "Monitor not found" },
        { status: 404 }
      );
    }

    let isUp = false;

    try {
      const controller = new AbortController();

      const timeout = setTimeout(() => {
        controller.abort();
      }, 10000);

      const response = await fetch(monitor.url, {
        method: "GET",
        cache: "no-store",
        redirect: "follow",
        signal: controller.signal,
      });

      clearTimeout(timeout);

      isUp = response.status >= 200 && response.status < 400;
    } catch {
      isUp = false;
    }

    const updatedMonitor = await prisma.monitor.update({
      where: {
        id: monitor.id,
      },
      data: {
        status: isUp ? "UP" : "DOWN",
        lastCheckedAt: new Date(),
      },
    });

    if (!isUp) {
      const existingIncident = await prisma.incident.findFirst({
        where: {
          monitorId: monitor.id,
          status: {
            notIn: ["RESOLVED", "CLOSED"],
          },
        },
      });

      if (!existingIncident) {
        await prisma.incident.create({
          data: {
            workspaceId: workspace.id,
            monitorId: monitor.id,
            title: `${monitor.name} is down`,
            severity: "SEV_1",
            status: "INVESTIGATING",
          },
        });
      }
    }

    return NextResponse.json({
      monitor: updatedMonitor,
      isUp,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to check monitor" },
      { status: 500 }
    );
  }
}