import Link from "next/link";
import PageHeader from "@/components/PageHeader";

const CATALOG_SECTIONS = [
  {
    title: "Categories",
    description: "Manage product categories with bilingual names and sort order.",
    href: "/catalog/categories",
  },
  {
    title: "Products",
    description: "Add, edit, and manage products with variants and pricing.",
    href: "/catalog/products",
  },
];

export default function CatalogPage() {
  return (
    <div>
      <PageHeader
        title="Catalog"
        description="Manage products, categories, and variants."
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
                Manage →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
