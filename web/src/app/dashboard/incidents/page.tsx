import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import IncidentsDashboard from "@/components/IncidentsDashboard";

export default async function IncidentsPage() {
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

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold">
            🛠️ OpsPilot
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-zinc-400 hover:text-white transition"
            >
              Back to Dashboard
            </Link>

            <span className="text-sm text-zinc-400">{user.email}</span>

            <LogoutButton />
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Incidents</h1>
          <p className="text-zinc-400">
            Track downtime incidents for your monitored services.
          </p>
        </div>

        <IncidentsDashboard />
      </section>
    </main>
  );
}