"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isNavItemActive } from "@/lib/nav";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

/**
 * Lightweight inline SVG icons (no icon dependency). Each is a 20x20 stroke
 * icon that inherits the current text color.
 */
const iconProps = {
  className: "h-5 w-5 shrink-0",
  fill: "none",
  viewBox: "0 0 24 24",
  strokeWidth: 1.8,
  stroke: "currentColor",
  "aria-hidden": true,
} as const;

const NAV_ITEMS: NavItem[] = [
  {
    href: "/orders",
    label: "Orders",
    icon: (
      <svg {...iconProps}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
        />
      </svg>
    ),
  },
  {
    href: "/catalog",
    label: "Catalog",
    icon: (
      <svg {...iconProps}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 0 1-1.125-1.125v-3.75ZM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-8.25ZM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-2.25Z"
        />
      </svg>
    ),
  },
  {
    href: "/suppliers",
    label: "Suppliers",
    icon: (
      <svg {...iconProps}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-5.25m0-12.75h-6a1.125 1.125 0 0 0-1.125 1.125v6.75m9.75-7.875v9.75m0-9.75h2.25"
        />
      </svg>
    ),
  },
  {
    href: "/customers",
    label: "Customers",
    icon: (
      <svg {...iconProps}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
        />
      </svg>
    ),
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: (
      <svg {...iconProps}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
        />
      </svg>
    ),
  },
];

/**
 * Persistent left sidebar for the admin dashboard. Shows the brand, primary
 * navigation with the active route highlighted, and the signed-in admin's
 * email with a sign-out action at the bottom.
 */
export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-stone-900 text-stone-100">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-stone-800 px-6 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-clay font-bold text-white">
          H
        </span>
        <div className="leading-tight">
          <p className="font-bold text-white">Hader Admin</p>
          <p className="text-xs text-stone-400">Coffee Supplies</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-clay text-white"
                  : "text-stone-300 hover:bg-stone-800 hover:text-white"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Signed-in admin + sign out */}
      <div className="border-t border-stone-800 px-4 py-4">
        <p className="truncate text-xs text-stone-400" title={user?.email ?? undefined}>
          {user?.email ?? "Signed in"}
        </p>
        <button
          onClick={signOut}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-stone-700 px-3 py-2 text-sm font-medium text-stone-200 transition-colors hover:bg-stone-800 hover:text-white"
        >
          <svg {...iconProps} className="h-4 w-4 shrink-0">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
            />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
