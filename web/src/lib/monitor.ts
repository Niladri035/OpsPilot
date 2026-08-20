import { prisma } from "@/lib/prisma";
import type { Monitor } from "@prisma/client";
import { sendAlertEmail } from "@/lib/email";

function shouldCheckMonitor(monitor: Monitor): boolean {
  if (!monitor.lastCheckedAt) {
    return true;
  }

  const intervalMs = monitor.intervalSeconds * 1000;
  const elapsed = Date.now() - monitor.lastCheckedAt.getTime();

  return elapsed >= intervalMs;
}

export async function checkMonitor(monitor: Monitor): Promise<boolean> {
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
      headers: {
        "User-Agent": "OpsPilot Monitor/1.0",
      },
    });

    clearTimeout(timeout);

    isUp = response.status >= 200 && response.status < 400;
  } catch {
    isUp = false;
  }

  await prisma.monitor.update({
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
  const incident = await prisma.incident.create({
    data: {
      workspaceId: monitor.workspaceId,
      monitorId: monitor.id,
      title: `${monitor.name} is down`,
      severity: "SEV_1",
      status: "INVESTIGATING",
    },
  });

  // Workspace owner-এর email নাও
  const workspace = await prisma.workspace.findUnique({
    where: { id: monitor.workspaceId },
    include: {
      owner: {
        select: { email: true },
      },
    },
  });

  const alertTo =
    workspace?.owner?.email ||
    process.env.ALERT_EMAIL_TO ||
    "";

  await sendAlertEmail({
    to: alertTo,
    subject: `🚨 OpsPilot Alert: ${monitor.name} is DOWN`,
    incidentTitle: incident.title,
    monitorName: monitor.name,
    monitorUrl: monitor.url,
    severity: incident.severity,
    workspaceName: workspace?.name || "Unknown Workspace",
  });
}
  }

  return isUp;
}

export async function runWorkspaceMonitorChecks(
  workspaceId: string,
  force: boolean = true
) {
  const monitors = await prisma.monitor.findMany({
    where: {
      workspaceId,
    },
  });

  let checked = 0;
  let down = 0;
  let skipped = 0;

  for (const monitor of monitors) {
    if (!force && !shouldCheckMonitor(monitor)) {
      skipped++;
      continue;
    }

    const isUp = await checkMonitor(monitor);

    checked++;

    if (!isUp) {
      down++;
    }
  }

  return {
    checked,
    down,
    skipped,
  };
}

export async function runAllMonitorChecks(force: boolean = false) {
  const monitors = await prisma.monitor.findMany();

  let checked = 0;
  let down = 0;
  let skipped = 0;

  for (const monitor of monitors) {
    if (!force && !shouldCheckMonitor(monitor)) {
      skipped++;
      continue;
    }

    const isUp = await checkMonitor(monitor);

    checked++;

    if (!isUp) {
      down++;
    }
  }

  return {
    checked,
    down,
    skipped,
  };
}