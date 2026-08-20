import { NextResponse } from "next/server";
import { getCurrentWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import { analyzeIncident } from "@/lib/ai";

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
      include: {
        monitor: true,
      },
    });

    if (!incident) {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 }
      );
    }

    const { analysis, model } = await analyzeIncident({
      title: incident.title,
      severity: incident.severity,
      status: incident.status,
      monitorName: incident.monitor?.name,
      monitorUrl: incident.monitor?.url,
      lastCheckedAt: incident.monitor?.lastCheckedAt,
    });

    const savedAnalysis = await prisma.aiAnalysis.create({
      data: {
        incidentId: incident.id,
        rootCause: analysis.rootCause,
        reasoning: analysis.reasoning,
        recommendation: analysis.recommendation,
        model,
      },
    });

    return NextResponse.json({
      analysis: savedAnalysis,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to investigate incident" },
      { status: 500 }
    );
  }
}