import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentWorkspace() {
  const session = await getServerSession(authOptions);

  const email = session?.user?.email;

  if (!email) {
    return null;
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

  const workspace = user?.memberships[0]?.workspace;

  if (!workspace) {
    return null;
  }

  return workspace;
}
