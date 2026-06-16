"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { type Product, type Category } from "@/lib/types";
import { formatSar } from "@/lib/format";
import PageHeader from "@/components/PageHeader";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve the display price for a product. Variant items show lowest variant price. */
function displayPrice(product: Product): string {
  if (product.variants && product.variants.length > 0) {
    const lowest = Math.min(...product.variants.map((v) => v.price));
    return `From ${formatSar(lowest)}`;
  }
  return formatSar(product.price);
}

/** Case-insensitive substring check. */
function matchesSearch(text: string, term: string): boolean {
  return text.toLowerCase().includes(term.toLowerCase());
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ProductsListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Real-time products listener
  useEffect(() => {
    const q = query(collection(db, "products"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            categoryId: data.categoryId ?? "",
            name: {
              ar: data.name_ar ?? data.name?.ar ?? "",
              en: data.name_en ?? data.name?.en ?? "",
            },
            description: data.description,
            pricingUnitLabel: data.pricingUnitLabel ?? "",
            price: data.sellPrice ?? data.price ?? 0,
            costPrice: data.costPrice,
            available: data.inStock ?? data.available ?? true,
            madeToOrder: data.madeToOrder ?? false,
            deliveryEstimate: data.deliveryEstimate,
            imageUrl: data.imageUrl,
            supplierId: data.supplierId,
            variants: data.variants ?? [],
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Product;
        });
        setProducts(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Failed to load products:", err);
        setError("Could not load products. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Real-time categories listener (for filter dropdown and name resolution)
  useEffect(() => {
    const q = query(collection(db, "categories"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: {
              ar: data.name_ar ?? data.name?.ar ?? "",
              en: data.name_en ?? data.name?.en ?? "",
            },
            sortOrder: data.sortOrder ?? 0,
          } as Category;
        });
        setCategories(items);
      },
      (err) => {
        console.error("Failed to load categories:", err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Build category lookup map
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of categories) {
      map.set(cat.id, cat.name.en);
    }
    return map;
  }, [categories]);

  // Client-side filtering
  const filteredProducts = useMemo(() => {
    let result = products;

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.categoryId === selectedCategory);
    }

    // Filter by search (min 2 chars, matches name_ar or name_en)
    if (searchTerm.trim().length >= 2) {
      const term = searchTerm.trim();
      result = result.filter(
        (p) => matchesSearch(p.name.en, term) || matchesSearch(p.name.ar, term)
      );
    }

    return result;
  }, [products, selectedCategory, searchTerm]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage your product catalog."
        action={
          <Link
            href="/catalog/products/new"
            className="rounded-md bg-clay px-4 py-2 text-sm font-medium text-white hover:bg-clay-deep transition-colors"
          >
            Add Product
          </Link>
        }
      />

      <div className="p-8">
        {/* Filter controls */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          {/* Category dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/40"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name.en}
              </option>
            ))}
          </select>

          {/* Search input */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name (min 2 chars)…"
            className="w-full max-w-xs rounded-md border border-stone-200 px-3 py-2 text-sm text-ink placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-clay/40"
          />
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-md bg-clay-deep/10 px-4 py-3 text-sm text-clay-deep">
            {error}
          </div>
        )}

        {/* Products table */}
        <ProductsTable
          products={filteredProducts}
          categoryMap={categoryMap}
          loading={loading}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Products table component
// ---------------------------------------------------------------------------

function ProductsTable({
  products,
  categoryMap,
  loading,
}: {
  products: Product[];
  categoryMap: Map<string, string>;
  loading: boolean;
}) {
  if (loading) {
    return <p className="text-ink-soft">Loading products…</p>;
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-12 text-center">
        <p className="text-ink-soft">
          No products match your filters. Try adjusting your search or category
          selection, or{" "}
          <Link href="/catalog/products/new" className="text-clay hover:text-clay-deep font-medium">
            add a new product
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-medium">Image</th>
              <th className="px-4 py-3 font-medium">Name (English)</th>
              <th className="px-4 py-3 font-medium">Name (Arabic)</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Made to Order</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-stone-50">
                {/* Thumbnail */}
                <td className="px-4 py-3">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name.en}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-stone-100 text-stone-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                        />
                      </svg>
                    </div>
                  )}
                </td>

                {/* Name (English) */}
                <td className="px-4 py-3 font-medium text-ink">
                  {product.name.en}
                </td>

                {/* Name (Arabic) */}
                <td className="px-4 py-3 text-ink" dir="rtl">
                  {product.name.ar}
                </td>

                {/* Category */}
                <td className="px-4 py-3 text-ink-soft">
                  {categoryMap.get(product.categoryId) ?? "—"}
                </td>

                {/* Price */}
                <td className="px-4 py-3 text-ink">
                  {displayPrice(product)}
                </td>

                {/* Stock status */}
                <td className="px-4 py-3">
                  {product.available ? (
                    <span className="inline-flex items-center rounded-full bg-sage/15 px-2.5 py-0.5 text-xs font-medium text-sage">
                      In Stock
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
                      Out of Stock
                    </span>
                  )}
                </td>

                {/* Made to order */}
                <td className="px-4 py-3 text-center">
                  {product.madeToOrder ? (
                    <span className="inline-flex items-center rounded-full bg-clay/10 px-2.5 py-0.5 text-xs font-medium text-clay-deep">
                      Made to Order
                    </span>
                  ) : (
                    <span className="text-stone-400">—</span>
                  )}
                </td>

                {/* Edit action */}
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/catalog/products/${product.id}/edit`}
                    className="rounded px-2 py-1 text-xs font-medium text-clay hover:bg-stone-100"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
