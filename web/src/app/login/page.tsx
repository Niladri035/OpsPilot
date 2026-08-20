"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-zinc-800 rounded-xl p-8 bg-zinc-900/50">
        <h1 className="text-2xl font-bold mb-2">Login to OpsPilot</h1>
        <p className="text-zinc-400 text-sm mb-8">
          Monitor your websites and fix incidents faster.
        </p>

        {error && (
          <div className="bg-red-900/40 border border-red-800 text-red-300 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white"
              required
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400 mb-1 block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 py-3 rounded-lg font-semibold transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-sm text-zinc-400 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-purple-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}