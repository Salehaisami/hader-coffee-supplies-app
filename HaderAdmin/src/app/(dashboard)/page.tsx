"use client";

import Link from "next/link";
import PageHeader from "@/components/PageHeader";

const SECTIONS = [
  { href: "/orders", label: "Orders", description: "View and manage incoming orders" },
  { href: "/catalog", label: "Catalog", description: "Manage products, categories, and variants" },
  { href: "/suppliers", label: "Suppliers", description: "Manage supplier contacts" },
  { href: "/customers", label: "Customers", description: "Onboard and approve customers" },
  { href: "/analytics", label: "Analytics", description: "Track revenue and performance" },
];

export default function DashboardHome() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Welcome to the Hader Coffee Supplies admin dashboard."
      />
      <div className="grid grid-cols-1 gap-4 p-8 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm transition-colors hover:border-clay"
          >
            <p className="font-semibold text-ink">{section.label}</p>
            <p className="mt-1 text-sm text-ink-soft">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
