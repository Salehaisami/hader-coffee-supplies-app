"use client";

import { useState, type FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useEffect } from "react";
import LanguageToggle from "@/components/LanguageToggle";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLocale();

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
          setError(t.auth.errors.invalidEmail);
          break;
        case "auth/user-not-found":
          setError(t.auth.errors.userNotFound);
          break;
        case "auth/wrong-password":
          setError(t.auth.errors.wrongPassword);
          break;
        case "auth/invalid-credential":
          setError(t.auth.errors.invalidCredential);
          break;
        case "auth/too-many-requests":
          setError(t.auth.errors.tooManyRequests);
          break;
        default:
          setError(t.auth.errors.generic);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show nothing while checking auth state
  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="text-ink-soft">{t.general.loading}</p>
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
        {/* Language toggle top-right */}
        <div className="mb-4 flex justify-end">
          <LanguageToggle variant="inline" />
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-ink">{t.auth.title}</h1>
          <p className="mt-2 text-sm text-ink-soft">{t.auth.subtitle}</p>
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
              {t.auth.email}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              dir="ltr"
              className="w-full rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-ink placeholder:text-stone-400 focus:border-clay focus:outline-none focus:ring-1 focus:ring-clay"
              placeholder={t.auth.emailPlaceholder}
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-ink"
            >
              {t.auth.password}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              dir="ltr"
              className="w-full rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-ink placeholder:text-stone-400 focus:border-clay focus:outline-none focus:ring-1 focus:ring-clay"
              placeholder={t.auth.passwordPlaceholder}
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
            {loading ? t.auth.signingIn : t.auth.signIn}
          </button>
        </form>
      </div>
    </main>
  );
}
