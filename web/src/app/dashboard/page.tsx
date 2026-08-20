import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import MonitorDashboard from "@/components/MonitorDashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const email = session?.user?.email;

  if (!email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: {
          workspace: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const workspace = user.memberships[0]?.workspace;
  const workspaceId = workspace?.id;

  const [totalMonitors, downMonitors, activeIncidents] = workspaceId
    ? await Promise.all([
        prisma.monitor.count({
          where: {
            workspaceId,
          },
        }),
        prisma.monitor.count({
          where: {
            workspaceId,
            status: "DOWN",
          },
        }),
        prisma.incident.count({
          where: {
            workspaceId,
            status: {
              notIn: ["RESOLVED", "CLOSED"],
            },
          },
        }),
      ])
    : [0, 0, 0];

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-bold">🛠️ OpsPilot</div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/incidents"
              className="relative border border-zinc-700 px-4 py-2 rounded-lg text-sm hover:bg-zinc-900 transition"
            >
              Incidents
              {activeIncidents > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {activeIncidents}
                </span>
              )}
            </Link>

            <span className="text-sm text-zinc-400 hidden md:block">
              {user.email}
            </span>

            <LogoutButton />
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-zinc-400">Welcome back, {user.name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/50">
            <h2 className="text-sm text-zinc-400 mb-2">Total Monitors</h2>
            <p className="text-3xl font-bold">{totalMonitors}</p>
          </div>

          <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/50">
            <h2 className="text-sm text-zinc-400 mb-2">Down Monitors</h2>
            <p className="text-3xl font-bold text-red-400">
              {downMonitors}
            </p>
          </div>

          <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/50">
            <h2 className="text-sm text-zinc-400 mb-2">Active Incidents</h2>
            <p className="text-3xl font-bold text-yellow-400">
              {activeIncidents}
            </p>
          </div>
        </div>

        <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/50">
          <h2 className="text-lg font-semibold mb-2">Current Workspace</h2>
          <p className="text-zinc-400">
            {workspace?.name || "No workspace found"}
          </p>

          <div className="flex flex-wrap gap-3 mt-4">
            <Link
              href="/dashboard/incidents"
              className="inline-block bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition"
            >
              View Incidents
            </Link>

            {workspace?.id && (
              <Link
                href={`/status/${workspace.id}`}
                target="_blank"
                className="inline-block border border-zinc-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-900 transition"
              >
                Public Status Page
              </Link>
            )}
          </div>
        </div>

        <MonitorDashboard />
      </section>
    </main>
  );
}