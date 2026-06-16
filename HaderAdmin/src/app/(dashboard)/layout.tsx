"use client";

import { type ReactNode } from "react";
import AdminGuard from "@/components/AdminGuard";
import Sidebar from "@/components/Sidebar";

/**
 * Shared layout for all dashboard pages. Wraps the route group in AdminGuard
 * so every page here is admin-protected, and renders the persistent sidebar
 * alongside the page content.
 *
 * The /login route lives outside this group and therefore has no sidebar.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-stone-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </AdminGuard>
  );
}
