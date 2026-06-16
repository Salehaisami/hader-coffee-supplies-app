"use client";

import { useState, type FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // If already authenticated, redirect to home
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/");
    } catch (err: unknown) {
      const errorCode = (err as { code?: string })?.code;
      switch (errorCode) {
        case "auth/invalid-email":
          setError("Invalid email address.");
          break;
        case "auth/user-not-found":
          setError("No account found with this email.");
          break;
        case "auth/wrong-password":
          setError("Incorrect password.");
          break;
        case "auth/invalid-credential":
          setError("Invalid email or password.");
          break;
        case "auth/too-many-requests":
          setError("Too many attempts. Please try again later.");
          break;
        default:
          setError("Sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Show nothing while checking auth state
  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="text-ink-soft">Loading...</p>
      </main>
    );
  }

  // If already signed in, don't render form (redirect is happening)
  if (user) {
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-ink">Hader Admin</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Sign in to manage your coffee supplies
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-ink"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-ink placeholder:text-stone-400 focus:border-clay focus:outline-none focus:ring-1 focus:ring-clay"
              placeholder="admin@hader.sa"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-ink"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-ink placeholder:text-stone-400 focus:border-clay focus:outline-none focus:ring-1 focus:ring-clay"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-clay px-4 py-2 font-medium text-white transition-colors hover:bg-clay-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
