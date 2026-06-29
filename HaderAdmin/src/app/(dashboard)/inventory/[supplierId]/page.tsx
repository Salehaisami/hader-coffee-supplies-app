"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type Product } from "@/lib/types";
import { useLocale } from "@/contexts/LocaleContext";
import PageHeader from "@/components/PageHeader";
import { formatTimestamp } from "@/lib/format";

interface InventoryItem {
  productId: string;
  quantity: number;
  lowStockThreshold: number;
  lastUpdated: unknown;
}

export default function SupplierInventoryPage() {
  const params = useParams<{ supplierId: string }>();
  const supplierId = params?.supplierId ?? "";
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [supplierName, setSupplierName] = useState("");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editThreshold, setEditThreshold] = useState("");
  const [saving, setSaving] = useState(false);

  // Add product state
  const [showAdd, setShowAdd] = useState(false);
  const [addProductId, setAddProductId] = useState("");
  const [addQty, setAddQty] = useState("0");
  const [addThreshold, setAddThreshold] = useState("5");

  useEffect(() => {
    loadData();
  }, [supplierId]);

  async function loadData() {
    if (!supplierId) return;
    try {
      // Load supplier name
      const supplierSnap = await getDoc(doc(db, "suppliers", supplierId));
      if (supplierSnap.exists()) {
        setSupplierName(supplierSnap.data().name || "");
      }

      // Load all products
      const productsSnap = await getDocs(collection(db, "products"));
      const prods: Product[] = [];
      productsSnap.forEach((d) => prods.push({ id: d.id, ...d.data() } as Product));
      setProducts(prods);

      // Load inventory subcollection
      const invSnap = await getDocs(collection(db, "suppliers", supplierId, "inventory"));
      const items: InventoryItem[] = [];
      invSnap.forEach((d) => items.push({ productId: d.id, ...d.data() } as InventoryItem));
      setInventory(items);
    } catch (err) {
      console.error("Failed to load inventory:", err);
    }
    setLoading(false);
  }

  function getProductName(productId: string): string {
    const p = products.find((pr) => pr.id === productId);
    if (!p) return productId;
    const raw = p as unknown as Record<string, unknown>;
    if (isAr) return (raw.name_ar as string) || (raw.name_en as string) || productId;
    return (raw.name_en as string) || (raw.name_ar as string) || productId;
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "suppliers", supplierId, "inventory", editingId), {
        productId: editingId,
        quantity: parseFloat(editQty) || 0,
        lowStockThreshold: parseFloat(editThreshold) || 0,
        lastUpdated: serverTimestamp(),
      });
      setInventory((prev) =>
        prev.map((item) =>
          item.productId === editingId
            ? { ...item, quantity: parseFloat(editQty) || 0, lowStockThreshold: parseFloat(editThreshold) || 0 }
            : item
        )
      );
      setEditingId(null);
    } catch (err) {
      console.error("Failed to save:", err);
    }
    setSaving(false);
  }

  async function handleAdd() {
    if (!addProductId) return;
    setSaving(true);
    try {
      const newItem: InventoryItem = {
        productId: addProductId,
        quantity: parseFloat(addQty) || 0,
        lowStockThreshold: parseFloat(addThreshold) || 0,
        lastUpdated: null,
      };
      await setDoc(doc(db, "suppliers", supplierId, "inventory", addProductId), {
        ...newItem,
        lastUpdated: serverTimestamp(),
      });
      setInventory((prev) => [...prev, newItem]);
      setShowAdd(false);
      setAddProductId("");
      setAddQty("0");
      setAddThreshold("5");
    } catch (err) {
      console.error("Failed to add:", err);
    }
    setSaving(false);
  }

  async function handleRemove(productId: string) {
    if (!confirm(isAr ? "هل أنت متأكد من حذف هذا المنتج من المخزون؟" : "Remove this product from inventory?")) return;
    try {
      await deleteDoc(doc(db, "suppliers", supplierId, "inventory", productId));
      setInventory((prev) => prev.filter((i) => i.productId !== productId));
    } catch (err) {
      console.error("Failed to remove:", err);
    }
  }

  // Products not yet in inventory
  const availableProducts = products.filter(
    (p) => !inventory.some((i) => i.productId === p.id)
  );

  const labels = {
    title: isAr ? `مخزون: ${supplierName}` : `Inventory: ${supplierName}`,
    description: isAr ? "إدارة كميات المنتجات لدى هذا المورد" : "Manage product stock levels for this supplier",
    product: isAr ? "المنتج" : "Product",
    quantity: isAr ? "الكمية" : "Quantity",
    threshold: isAr ? "حد التنبيه" : "Threshold",
    status: isAr ? "الحالة" : "Status",
    actions: isAr ? "إجراءات" : "Actions",
    edit: isAr ? "تعديل" : "Edit",
    remove: isAr ? "حذف" : "Remove",
    save: isAr ? "حفظ" : "Save",
    cancel: isAr ? "إلغاء" : "Cancel",
    addProduct: isAr ? "إضافة منتج" : "Add Product",
    selectProduct: isAr ? "اختر منتج..." : "Select product...",
    empty: isAr ? "لا توجد منتجات في مخزون هذا المورد بعد" : "No products in this supplier's inventory yet",
    loading: isAr ? "جاري التحميل..." : "Loading...",
    ok: "✓",
    low: "⚠️",
  };

  return (
    <div>
      <PageHeader title={labels.title} description={labels.description} />
      <div className="mx-auto max-w-4xl p-8">
        {/* Add product */}
        {!showAdd && availableProducts.length > 0 && (
          <button
            onClick={() => setShowAdd(true)}
            className="mb-6 rounded-md bg-clay px-4 py-2 text-sm font-medium text-white hover:bg-clay-deep"
          >
            + {labels.addProduct}
          </button>
        )}

        {showAdd && (
          <div className="mb-6 rounded-lg border border-stone-200 bg-white p-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{labels.product}</label>
                <select
                  value={addProductId}
                  onChange={(e) => setAddProductId(e.target.value)}
                  className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
                >
                  <option value="">{labels.selectProduct}</option>
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>{getProductName(p.id)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{labels.quantity}</label>
                <input type="number" step="any" min="0" value={addQty} onChange={(e) => setAddQty(e.target.value)} className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm" dir="ltr" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">{labels.threshold}</label>
                <input type="number" step="any" min="0" value={addThreshold} onChange={(e) => setAddThreshold(e.target.value)} className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm" dir="ltr" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} disabled={saving || !addProductId} className="rounded-md bg-clay px-4 py-2 text-sm font-medium text-white hover:bg-clay-deep disabled:opacity-50">{saving ? "..." : labels.save}</button>
              <button onClick={() => setShowAdd(false)} className="rounded-md border border-stone-200 px-4 py-2 text-sm text-ink hover:bg-stone-50">{labels.cancel}</button>
            </div>
          </div>
        )}

        {/* Inventory table */}
        {loading ? (
          <p className="text-sm text-ink-soft">{labels.loading}</p>
        ) : inventory.length === 0 ? (
          <p className="text-sm text-ink-soft">{labels.empty}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-4 py-2.5 font-medium text-start">{labels.product}</th>
                  <th className="px-4 py-2.5 font-medium text-start">{labels.quantity}</th>
                  <th className="px-4 py-2.5 font-medium text-start">{labels.threshold}</th>
                  <th className="px-4 py-2.5 font-medium text-center">{labels.status}</th>
                  <th className="px-4 py-2.5 font-medium text-end">{labels.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {inventory.map((item) => {
                  const isLow = item.lowStockThreshold > 0 && item.quantity <= item.lowStockThreshold;
                  const isEditing = editingId === item.productId;

                  return (
                    <tr key={item.productId} className={`hover:bg-stone-50 ${isLow ? "bg-amber-50/50" : ""}`}>
                      <td className="px-4 py-3 text-ink font-medium">{getProductName(item.productId)}</td>
                      <td className="px-4 py-3" dir="ltr">
                        {isEditing ? (
                          <input type="number" step="any" value={editQty} onChange={(e) => setEditQty(e.target.value)} className="w-20 rounded border border-stone-200 px-2 py-1 text-sm" />
                        ) : (
                          <span className={isLow ? "text-amber-700 font-semibold" : "text-ink"}>{item.quantity}</span>
                        )}
                      </td>
                      <td className="px-4 py-3" dir="ltr">
                        {isEditing ? (
                          <input type="number" step="any" value={editThreshold} onChange={(e) => setEditThreshold(e.target.value)} className="w-20 rounded border border-stone-200 px-2 py-1 text-sm" />
                        ) : (
                          <span className="text-ink-soft">{item.lowStockThreshold}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-lg">
                        {isLow ? labels.low : labels.ok}
                      </td>
                      <td className="px-4 py-3 text-end">
                        {isEditing ? (
                          <span className="inline-flex gap-2">
                            <button onClick={handleSaveEdit} disabled={saving} className="text-xs text-clay hover:underline">{labels.save}</button>
                            <button onClick={() => setEditingId(null)} className="text-xs text-ink-soft hover:underline">{labels.cancel}</button>
                          </span>
                        ) : (
                          <span className="inline-flex gap-3">
                            <button onClick={() => { setEditingId(item.productId); setEditQty(String(item.quantity)); setEditThreshold(String(item.lowStockThreshold)); }} className="text-xs text-clay hover:underline">{labels.edit}</button>
                            <button onClick={() => handleRemove(item.productId)} className="text-xs text-clay-deep hover:underline">{labels.remove}</button>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
