"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, query, updateDoc } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { type Product, type Category } from "@/lib/types";
import { formatSar } from "@/lib/format";
import { useLocale } from "@/contexts/LocaleContext";
import PageHeader from "@/components/PageHeader";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve the display price for a product. Variant items show lowest variant price. */
function displayPrice(product: Product, locale: string, fromLabel: string): string {
  if (product.variants && product.variants.length > 0) {
    const lowest = Math.min(...product.variants.map((v) => v.price));
    return `${fromLabel} ${formatSar(lowest, locale)}`;
  }
  return formatSar(product.price, locale);
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { t, locale } = useLocale();

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

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [selectedCategory, searchTerm]);

  // Delete handler (single)
  async function handleDeleteProduct(id: string, name: string) {
    if (!window.confirm(`${t.catalog.products.deleteConfirm}\n\n${name}`)) return;
    try {
      await deleteDoc(doc(db, "products", id));
    } catch (err) {
      console.error("Failed to delete product:", err);
      setError(t.general.error);
    }
  }

  // Bulk delete handler
  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    const confirmMsg = locale === "ar"
      ? `هل أنت متأكد من حذف ${selectedIds.size} منتج؟ لا يمكن التراجع عن هذا الإجراء.`
      : `Are you sure you want to delete ${selectedIds.size} product(s)? This cannot be undone.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => deleteDoc(doc(db, "products", id)))
      );
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Bulk delete failed:", err);
      setError(locale === "ar" ? "فشل الحذف الجماعي" : "Bulk delete failed");
    }
  }

  // Bulk stock update handler
  async function handleBulkStockUpdate(available: boolean) {
    if (selectedIds.size === 0) return;
    const confirmMsg = locale === "ar"
      ? `هل تريد تحديث حالة المخزون لـ ${selectedIds.size} منتج؟`
      : `Update stock status of ${selectedIds.size} product(s)?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          updateDoc(doc(db, "products", id), { available, inStock: available })
        )
      );
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Bulk stock update failed:", err);
      setError(locale === "ar" ? "فشل التحديث الجماعي" : "Bulk update failed");
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div>
      <PageHeader
        title={t.catalog.products.title}
        description={t.catalog.products.description}
        action={
          <Link
            href="/catalog/products/new"
            className="rounded-md bg-clay px-4 py-2 text-sm font-medium text-white hover:bg-clay-deep transition-colors"
          >
            {t.catalog.products.addProduct}
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
            <option value="all">{t.catalog.products.allCategories}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {locale === "ar" ? cat.name.ar : cat.name.en}
              </option>
            ))}
          </select>

          {/* Search input */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.catalog.products.searchPlaceholder}
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
          onDelete={handleDeleteProduct}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
        />
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 shadow-lg p-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <span className="text-sm font-medium text-ink">
              {locale === "ar"
                ? `${selectedIds.size} محدد`
                : `${selectedIds.size} selected`}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleBulkStockUpdate(false)}
                className="rounded-md bg-stone-600 px-3 py-2 text-sm font-medium text-white hover:bg-stone-700 transition-colors"
              >
                {locale === "ar" ? "تحديد غير متوفر" : "Mark Out of Stock"}
              </button>
              <button
                type="button"
                onClick={() => handleBulkStockUpdate(true)}
                className="rounded-md bg-sage px-3 py-2 text-sm font-medium text-white hover:bg-sage/90 transition-colors"
              >
                {locale === "ar" ? "تحديد متوفر" : "Mark In Stock"}
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                {locale === "ar" ? "حذف المحدد" : "Delete Selected"}
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-ink hover:bg-stone-50 transition-colors"
              >
                {locale === "ar" ? "إلغاء التحديد" : "Clear"}
              </button>
            </div>
          </div>
        </div>
      )}
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
  onDelete,
  selectedIds,
  setSelectedIds,
}: {
  products: Product[];
  categoryMap: Map<string, string>;
  loading: boolean;
  onDelete: (id: string, name: string) => void;
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const { t, locale } = useLocale();

  const allSelected = products.length > 0 && products.every((p) => selectedIds.has(p.id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (loading) {
    return <p className="text-ink-soft">{t.general.loading}</p>;
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-12 text-center">
        <p className="text-ink-soft">
          {t.catalog.products.empty}{" "}
          <Link href="/catalog/products/new" className="text-clay hover:text-clay-deep font-medium">
            {t.catalog.products.addProduct}
          </Link>
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
              <th className="px-4 py-3 font-medium">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-stone-300 text-clay focus:ring-clay/40"
                />
              </th>
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
              <tr key={product.id} className={`hover:bg-stone-50 ${selectedIds.has(product.id) ? "bg-clay/5" : ""}`}>
                {/* Checkbox */}
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(product.id)}
                    onChange={() => toggleSelect(product.id)}
                    className="h-4 w-4 rounded border-stone-300 text-clay focus:ring-clay/40"
                  />
                </td>

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
                  {displayPrice(product, locale, t.catalog.products.fromPrice)}
                </td>

                {/* Stock status */}
                <td className="px-4 py-3">
                  {product.available ? (
                    <span className="inline-flex items-center rounded-full bg-sage/15 px-2.5 py-0.5 text-xs font-medium text-sage">
                      {t.catalog.products.inStock}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
                      {t.catalog.products.outOfStock}
                    </span>
                  )}
                </td>

                {/* Made to order */}
                <td className="px-4 py-3 text-center">
                  {product.madeToOrder ? (
                    <span className="inline-flex items-center rounded-full bg-clay/10 px-2.5 py-0.5 text-xs font-medium text-clay-deep">
                      {t.catalog.products.madeToOrder}
                    </span>
                  ) : (
                    <span className="text-stone-400">—</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/catalog/products/${product.id}/edit`}
                      className="rounded px-2 py-1 text-xs font-medium text-clay hover:bg-stone-100"
                    >
                      {t.general.edit}
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDelete(product.id, product.name.en || product.name.ar)}
                      className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      {t.general.delete}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
