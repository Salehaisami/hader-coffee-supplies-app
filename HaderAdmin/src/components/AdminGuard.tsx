"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Full-screen loading state shown while auth state and custom claims
 * are being resolved.
 */
function GuardLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50">
      <p className="text-ink-soft">Loading...</p>
    </main>
  );
}

/**
 * Access Denied screen shown to authenticated users who lack the admin
 * custom claim. Per Phase1-Resolved-Decisions.md §10, non-admins must be
 * clearly blocked (not silently redirected).
 */
function AccessDenied({
  email,
  onSignOut,
}: {
  email: string | null;
  onSignOut: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-clay/10">
          <svg
            className="h-6 w-6 text-clay"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-ink">Access Denied</h1>
        <p className="mt-3 text-sm text-ink-soft">
          This dashboard is for administrators only. Your account does not have
          admin access.
        </p>
        {email && (
          <p className="mt-2 text-xs text-stone-600">
            Signed in as {email}
          </p>
        )}
        <p className="mt-4 text-xs text-stone-600">
          If you believe this is a mistake, contact your administrator to have
          admin access granted to your account.
        </p>
        <button
          onClick={onSignOut}
          className="mt-6 w-full rounded-md bg-clay px-4 py-2 font-medium text-white transition-colors hover:bg-clay-deep"
        >
          Sign Out
        </button>
      </div>
    </main>
  );
}

/**
 * Route protection wrapper for admin-only pages.
 *
 * Behavior:
 * - While auth/claims are resolving: shows a loading state.
 * - Unauthenticated users: redirected to /login.
 * - Authenticated non-admins: shown a clear "Access Denied" message with a
 *   sign-out button (never silently redirected).
 * - Authenticated admins: renders children.
 */
export default function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Still resolving auth state / custom claims.
  if (loading) {
    return <GuardLoading />;
  }

  // Unauthenticated — redirect is in flight, render nothing.
  if (!user) {
    return null;
  }

  // Authenticated but not an admin — block with a clear message.
  if (!isAdmin) {
    return <AccessDenied email={user.email} onSignOut={signOut} />;
  }

  // Authenticated admin — allow access.
  return <>{children}</>;
}
