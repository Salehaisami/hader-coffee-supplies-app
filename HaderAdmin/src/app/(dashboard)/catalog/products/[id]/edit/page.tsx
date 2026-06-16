"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import PageHeader from "@/components/PageHeader";
import ProductForm, { type ProductFormData } from "@/components/ProductForm";

/**
 * /catalog/products/[id]/edit — Edit an existing product.
 * Loads the product document from Firestore and pre-fills the form.
 */
export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const productId = params.id;

  const [initialData, setInitialData] = useState<ProductFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const snap = await getDoc(doc(db, "products", productId));
        if (!snap.exists()) {
          setError("Product not found.");
          setLoading(false);
          return;
        }

        const data = snap.data();
        const firstSupplier = Array.isArray(data.suppliers) && data.suppliers.length > 0
          ? data.suppliers[0]
          : null;

        setInitialData({
          nameAr: data.name_ar ?? data.name?.ar ?? "",
          nameEn: data.name_en ?? data.name?.en ?? "",
          descriptionAr: data.description_ar ?? data.description?.ar ?? "",
          descriptionEn: data.description_en ?? data.description?.en ?? "",
          categoryId: data.categoryId ?? "",
          pricingUnit: data.pricingUnit ?? "dozen",
          price: data.sellPrice ?? data.price ?? 0,
          deliveryEstimateMin: typeof data.deliveryEstimate === "object" && data.deliveryEstimate
            ? data.deliveryEstimate.minValue ?? 2
            : 2,
          deliveryEstimateMax: typeof data.deliveryEstimate === "object" && data.deliveryEstimate
            ? data.deliveryEstimate.maxValue ?? 4
            : 4,
          deliveryEstimateUnit: typeof data.deliveryEstimate === "object" && data.deliveryEstimate
            ? data.deliveryEstimate.unit ?? "days"
            : "days",
          available: data.inStock ?? data.available ?? true,
          madeToOrder: data.madeToOrder ?? false,
          hasVariants: data.hasVariants ?? false,
          imageUrl: data.imageUrl ?? "",
          supplierId: firstSupplier?.supplierId ?? data.supplierId ?? "",
          costPrice: firstSupplier?.costPrice != null
            ? firstSupplier.costPrice
            : data.costPrice != null
            ? data.costPrice
            : undefined,
          variants: Array.isArray(data.variants)
            ? data.variants.map((v: Record<string, unknown>) => ({
                variantId: (v.variantId as string) ?? `v-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                label_ar: (v.label_ar as string) ?? "",
                label_en: (v.label_en as string) ?? "",
                sellPrice: (v.sellPrice as number) ?? 0,
                pricingUnit: (v.pricingUnit as string) ?? "dozen",
                inStock: (v.inStock as boolean) ?? true,
                costPrice: v.costPrice != null ? (v.costPrice as number) : undefined,
              }))
            : [],
        });
        setLoading(false);
      } catch (err) {
        console.error("Failed to load product:", err);
        setError("Failed to load product. Please try again.");
        setLoading(false);
      }
    }

    fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Edit Product" />
        <div className="p-8">
          <p className="text-ink-soft">Loading product…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Edit Product" />
        <div className="p-8">
          <div className="rounded-md bg-clay-deep/10 px-4 py-3 text-sm text-clay-deep">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Edit Product"
        description="Update product details."
      />
      <div className="mx-auto max-w-3xl p-8">
        <ProductForm initialData={initialData!} productId={productId} />
      </div>
    </div>
  );
}
