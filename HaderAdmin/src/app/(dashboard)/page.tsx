"use client";

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { useLocale } from "@/contexts/LocaleContext";

export default function DashboardHome() {
  const { t } = useLocale();

  const SECTIONS = [
    { href: "/orders", label: t.nav.orders, description: t.orders.description },
    { href: "/catalog", label: t.nav.catalog, description: t.catalog.description },
    { href: "/suppliers", label: t.nav.suppliers, description: t.suppliers.description },
    { href: "/customers", label: t.nav.customers, description: t.customers.description },
    { href: "/analytics", label: t.nav.analytics, description: t.analytics.description },
  ];

  return (
    <div>
      <PageHeader
        title={t.general.appName}
        description={t.auth.subtitle}
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
