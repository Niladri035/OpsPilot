import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-bold">🛠️ OpsPilot</div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-zinc-400">
            Welcome back, {user.name}
          </p>
        </div>

        <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/50">
          <h2 className="text-lg font-semibold mb-2">Current Workspace</h2>
          <p className="text-zinc-400">
            {workspace?.name || "No workspace found"}
          </p>
        </div>

        <MonitorDashboard />
      </section>
    </main>
  );
}