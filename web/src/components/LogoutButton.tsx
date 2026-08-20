"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() =>
        signOut({
          callbackUrl: "/login",
        })
      }
      className="border border-zinc-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-800 transition"
    >
      Logout
    </button>
  );
}