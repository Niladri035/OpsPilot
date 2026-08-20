import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PublicStatusPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: {
      id: workspaceId,
    },
    include: {
      monitors: {
        orderBy: {
          createdAt: "desc",
        },
      },
      incidents: {
        where: {
          status: {
            notIn: ["RESOLVED", "CLOSED"],
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
    },
  });

  if (!workspace || workspace.statusEnabled === false) {
    notFound();
  }

  const downMonitors = workspace.monitors.filter(
    (monitor) => monitor.status === "DOWN"
  ).length;

  const allOperational =
    downMonitors === 0 && workspace.incidents.length === 0;

  const monitorStatusColor = (status: string) => {
    if (status === "UP") {
      return "bg-green-900/40 text-green-300 border-green-800";
    }

    if (status === "DOWN") {
      return "bg-red-900/40 text-red-300 border-red-800";
    }

    return "bg-zinc-800 text-zinc-300 border-zinc-700";
  };

  const incidentSeverityColor = (severity: string) => {
    if (severity === "SEV_1") {
      return "bg-red-900/50 text-red-300 border-red-800";
    }

    if (severity === "SEV_2") {
      return "bg-orange-900/50 text-orange-300 border-orange-800";
    }

    if (severity === "SEV_3") {
      return "bg-yellow-900/50 text-yellow-300 border-yellow-800";
    }

    return "bg-zinc-800 text-zinc-300 border-zinc-700";
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-bold">
            {workspace.name} — Status
          </div>

          <div className="text-sm text-zinc-400">
            Powered by OpsPilot
          </div>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        {allOperational ? (
          <div className="border border-green-800 bg-green-900/20 rounded-xl p-6">
            <h1 className="text-2xl font-bold text-green-300">
              ✅ All systems operational
            </h1>
            <p className="text-zinc-400 mt-2">
              No active incidents detected.
            </p>
          </div>
        ) : (
          <div className="border border-red-800 bg-red-900/20 rounded-xl p-6">
            <h1 className="text-2xl font-bold text-red-300">
              ⚠️ Service issues detected
            </h1>
            <p className="text-zinc-400 mt-2">
              {downMonitors} monitor(s) down and{" "}
              {workspace.incidents.length} active incident(s).
            </p>
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold mb-4">
            Active Incidents
          </h2>

          {workspace.incidents.length === 0 ? (
            <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/50">
              <p className="text-zinc-400 text-sm">
                No active incidents.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {workspace.incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/50"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold">
                      {incident.title}
                    </h3>

                    <span
                      className={`px-3 py-1 text-xs rounded-full border ${incidentSeverityColor(
                        incident.severity
                      )}`}
                    >
                      {incident.severity}
                    </span>

                    <span className="px-3 py-1 text-xs rounded-full border bg-yellow-900/40 text-yellow-300 border-yellow-800">
                      {incident.status}
                    </span>
                  </div>

                  <p className="text-zinc-400 text-sm mt-3">
                    Started:{" "}
                    {new Date(incident.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">
            Monitored Services
          </h2>

          {workspace.monitors.length === 0 ? (
            <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/50">
              <p className="text-zinc-400 text-sm">
                No monitored services added yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {workspace.monitors.map((monitor) => (
                <div
                  key={monitor.id}
                  className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div>
                    <h3 className="text-lg font-semibold">
                      {monitor.name}
                    </h3>

                    <p className="text-zinc-500 text-sm mt-1">
                      Last checked:{" "}
                      {monitor.lastCheckedAt
                        ? new Date(
                            monitor.lastCheckedAt
                          ).toLocaleString()
                        : "Never"}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 text-xs rounded-full border ${monitorStatusColor(
                      monitor.status
                    )}`}
                  >
                    {monitor.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}