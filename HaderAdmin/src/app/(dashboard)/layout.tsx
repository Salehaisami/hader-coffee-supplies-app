"use client";

import { type ReactNode, useState } from "react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-stone-50">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - hidden on mobile unless toggled */}
        <div
          className={`fixed inset-y-0 start-0 z-40 transition-transform duration-200 ease-in-out lg:relative lg:!translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "max-lg:-translate-x-full max-lg:rtl:translate-x-full"
          }`}
        >
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {/* Mobile header with hamburger */}
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-stone-200 bg-stone-50 px-4 py-3 lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-2 text-stone-600 hover:bg-stone-200"
              aria-label="Open menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <span className="flex h-7 w-7 items-center justify-center rounded bg-clay text-sm font-bold text-white">
              H
            </span>
            <span className="font-semibold text-ink">Hader Admin</span>
          </header>

          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </AdminGuard>
  );
}
