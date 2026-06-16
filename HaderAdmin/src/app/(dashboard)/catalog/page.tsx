"use client";

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { useLocale } from "@/contexts/LocaleContext";

export default function CatalogPage() {
  const { t, isRTL } = useLocale();

  const CATALOG_SECTIONS = [
    {
      title: t.catalog.categories.title,
      description: t.catalog.categories.description,
      href: "/catalog/categories",
    },
    {
      title: t.catalog.products.title,
      description: t.catalog.products.description,
      href: "/catalog/products",
    },
  ];

  // RTL arrow points left (←), LTR arrow points right (→)
  const arrow = isRTL ? "←" : "→";

  return (
    <div>
      <PageHeader
        title={t.catalog.title}
        description={t.catalog.description}
      />
      <div className="p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {CATALOG_SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="group rounded-lg border border-stone-200 bg-white p-6 transition-colors hover:border-clay/40 hover:shadow-sm"
            >
              <h2 className="text-lg font-semibold text-ink group-hover:text-clay">
                {section.title}
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                {section.description}
              </p>
              <span className="mt-3 inline-block text-sm font-medium text-clay group-hover:text-clay-deep">
                {t.general.edit} {arrow}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
