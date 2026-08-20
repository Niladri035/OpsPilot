import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          name: "My Workspace",
          ownerId: newUser.id,
        },
      });

      await tx.membership.create({
        data: {
          userId: newUser.id,
          workspaceId: workspace.id,
          role: "OWNER",
        },
      });

      return newUser;
    });

    return NextResponse.json({
      ok: true,
      userId: user.id,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Signup failed" },
      { status: 500 }
    );
  }
}