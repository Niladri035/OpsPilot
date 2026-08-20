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
    const incidentId = body.incidentId;

    if (!incidentId) {
      return NextResponse.json(
        { error: "incidentId is required" },
        { status: 400 }
      );
    }

    const incident = await prisma.incident.findFirst({
      where: {
        id: incidentId,
        workspaceId: workspace.id,
      },
    });

    if (!incident) {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 }
      );
    }

    const updatedIncident = await prisma.incident.update({
      where: {
        id: incident.id,
      },
      data: {
        status: "RESOLVED",
      },
    });

    return NextResponse.json({
      incident: updatedIncident,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to resolve incident" },
      { status: 500 }
    );
  }
}