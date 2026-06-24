"use client";

import { useLocale } from "@/contexts/LocaleContext";
import PageHeader from "@/components/PageHeader";
import ProductForm from "@/components/ProductForm";

/**
 * /catalog/products/new — Create a new product.
 */
export default function NewProductPage() {
  const { t } = useLocale();

  return (
    <div>
      <PageHeader
        title={t.productForm.newProductTitle}
        description={t.productForm.newProductDescription}
      />
      <div className="mx-auto max-w-3xl p-8">
        <ProductForm />
      </div>
    </div>
  );
}
