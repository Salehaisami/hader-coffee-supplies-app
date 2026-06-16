"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type Order, type OrderStatus, type Supplier } from "@/lib/types";
import { computeOrderMetrics, computeTopProducts, computeOrdersBySupplier, computeEstimatedProfit } from "@/lib/analytics";
import { formatSar, formatNumber } from "@/lib/format";
import PageHeader from "@/components/PageHeader";

/** Human-readable labels for order statuses. */
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  sent_to_supplier: "Sent to Supplier",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Color styles for status breakdown cards. */
const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "text-amber-600",
  sent_to_supplier: "text-blue-600",
  delivered: "text-green-600",
  cancelled: "text-red-500",
};

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const next = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Order
        );
        setOrders(next);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Failed to load orders:", err);
        setError("Could not load orders. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const suppliersQuery = query(collection(db, "suppliers"));

    const unsubscribe = onSnapshot(
      suppliersQuery,
      (snapshot) => {
        const next = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Supplier
        );
        setSuppliers(next);
      },
      (err) => {
        console.error("Failed to load suppliers:", err);
      }
    );

    return () => unsubscribe();
  }, []);

  const metrics = computeOrderMetrics(orders);
  const topProducts = computeTopProducts(orders);
  const supplierBreakdown = computeOrdersBySupplier(orders, suppliers);
  const profitEstimate = computeEstimatedProfit(orders);

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Track revenue, top products, and performance."
      />
      <div className="p-8">
        {loading && <p className="text-ink-soft">Loading analytics…</p>}
        {error && <p className="text-clay-deep">{error}</p>}
        {!loading && !error && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <SummaryCard
                label="Total Orders"
                value={formatNumber(metrics.totalOrders)}
              />
              <SummaryCard
                label="Total Revenue"
                value={formatSar(metrics.totalRevenue)}
              />
              <SummaryCard
                label="Orders by Status"
                value=""
                custom={
                  <div className="mt-2 space-y-1">
                    {(Object.keys(metrics.ordersByStatus) as OrderStatus[]).map(
                      (status) => (
                        <div
                          key={status}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-ink-soft">
                            {STATUS_LABELS[status]}
                          </span>
                          <span
                            className={`font-semibold ${STATUS_COLORS[status]}`}
                          >
                            {formatNumber(metrics.ordersByStatus[status])}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                }
              />
            </div>

            {/* Estimated Profit card — only visible when cost data exists */}
            {profitEstimate.hasCostData && (
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-medium text-ink-soft">
                    Estimated Profit
                  </p>
                  <p className="mt-2 text-3xl font-bold text-clay">
                    {formatSar(profitEstimate.estimatedProfit)}
                  </p>
                  <p className="mt-2 text-xs text-ink-soft">
                    Based on {formatNumber(profitEstimate.itemsWithCostData)} of{" "}
                    {formatNumber(profitEstimate.totalItems)} line item
                    {profitEstimate.totalItems === 1 ? "" : "s"}
                    {profitEstimate.isPartial && (
                      <span className="text-amber-600">
                        {" "}
                        — partial (not all items have cost data)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Top Products section */}
            <section className="mt-10">
              <h2 className="text-lg font-semibold text-ink">Top Products</h2>
              <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* By Quantity Sold */}
                <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-medium text-ink-soft">
                    By Quantity Sold
                  </h3>
                  {topProducts.topByQuantity.length === 0 ? (
                    <p className="mt-4 text-sm text-ink-soft">No data yet.</p>
                  ) : (
                    <ol className="mt-4 space-y-3">
                      {topProducts.topByQuantity.map((product, index) => (
                        <li
                          key={product.name}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-ink">
                            <span className="mr-2 font-semibold text-clay">
                              {index + 1}.
                            </span>
                            {product.name}
                          </span>
                          <span className="text-sm font-semibold text-ink">
                            {formatNumber(product.quantity)} units
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>

                {/* By Revenue */}
                <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-medium text-ink-soft">
                    By Revenue
                  </h3>
                  {topProducts.topByRevenue.length === 0 ? (
                    <p className="mt-4 text-sm text-ink-soft">No data yet.</p>
                  ) : (
                    <ol className="mt-4 space-y-3">
                      {topProducts.topByRevenue.map((product, index) => (
                        <li
                          key={product.name}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-ink">
                            <span className="mr-2 font-semibold text-clay">
                              {index + 1}.
                            </span>
                            {product.name}
                          </span>
                          <span className="text-sm font-semibold text-ink">
                            {formatSar(product.revenue)}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            </section>

            {/* Orders by Supplier section */}
            <section className="mt-10">
              <h2 className="text-lg font-semibold text-ink">
                Orders by Supplier
              </h2>
              <div className="mt-4 rounded-lg border border-stone-200 bg-white shadow-sm">
                {supplierBreakdown.length === 0 ? (
                  <p className="p-6 text-sm text-ink-soft">No data yet.</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 bg-stone-50">
                        <th className="px-6 py-3 font-medium text-ink-soft">
                          Supplier
                        </th>
                        <th className="px-6 py-3 text-right font-medium text-ink-soft">
                          Orders
                        </th>
                        <th className="px-6 py-3 text-right font-medium text-ink-soft">
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierBreakdown.map((entry) => (
                        <tr
                          key={entry.supplierName}
                          className="border-b border-stone-100 last:border-b-0"
                        >
                          <td className="px-6 py-3 font-medium text-ink">
                            {entry.supplierName}
                          </td>
                          <td className="px-6 py-3 text-right text-ink">
                            {formatNumber(entry.orderCount)}
                          </td>
                          <td className="px-6 py-3 text-right font-semibold text-ink">
                            {formatSar(entry.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * A single summary card with a label and a large value.
 * Optionally accepts custom content rendered below the label.
 */
function SummaryCard({
  label,
  value,
  custom,
}: {
  label: string;
  value: string;
  custom?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-ink-soft">{label}</p>
      {value && (
        <p className="mt-2 text-3xl font-bold text-ink">{value}</p>
      )}
      {custom}
    </div>
  );
}
