"use client";

import PageHeader from "@/components/PageHeader";
import ProductForm from "@/components/ProductForm";

/**
 * /catalog/products/new — Create a new product.
 */
export default function NewProductPage() {
  return (
    <div>
      <PageHeader
        title="New Product"
        description="Add a new product to the catalog."
      />
      <div className="mx-auto max-w-3xl p-8">
        <ProductForm />
      </div>
    </div>
  );
}
