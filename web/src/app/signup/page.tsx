"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        setLoading(false);
        return;
      }

      const signInRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      setLoading(false);

      if (signInRes?.ok) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    } catch {
      setLoading(false);
      setError("Something went wrong");
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-zinc-800 rounded-xl p-8 bg-zinc-900/50">
        <h1 className="text-2xl font-bold mb-2">Create OpsPilot account</h1>
        <p className="text-zinc-400 text-sm mb-8">
          Start monitoring your websites with AI.
        </p>

        {error && (
          <div className="bg-red-900/40 border border-red-800 text-red-300 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white"
              required
            />
          </div>

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
              placeholder="At least 6 characters"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 py-3 rounded-lg font-semibold transition"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="text-sm text-zinc-400 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-purple-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}