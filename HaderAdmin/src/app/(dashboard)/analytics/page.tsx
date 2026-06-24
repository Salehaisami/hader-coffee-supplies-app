"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type Order, type OrderStatus, type Supplier } from "@/lib/types";
import { computeOrderMetrics, computeTopProducts, computeOrdersBySupplier, computeEstimatedProfit } from "@/lib/analytics";
import { formatSar, formatNumber } from "@/lib/format";
import { useLocale } from "@/contexts/LocaleContext";
import PageHeader from "@/components/PageHeader";

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
  const { t, locale } = useLocale();

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
        setError(t.orders.loadError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [t.orders.loadError]);

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
  const supplierBreakdown = computeOrdersBySupplier(orders, suppliers, {
    unassigned: t.analytics.unassigned,
    unknownSupplier: t.analytics.unknownSupplier,
  });
  const profitEstimate = computeEstimatedProfit(orders);

  return (
    <div>
      <PageHeader
        title={t.analytics.title}
        description={t.analytics.description}
      />
      <div className="p-8">
        {loading && <p className="text-ink-soft">{t.general.loading}</p>}
        {error && <p className="text-clay-deep">{error}</p>}
        {!loading && !error && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <SummaryCard
                label={t.analytics.totalOrders}
                value={formatNumber(metrics.totalOrders)}
              />
              <SummaryCard
                label={t.analytics.totalRevenue}
                value={formatSar(metrics.totalRevenue, locale)}
              />
              <SummaryCard
                label={t.analytics.ordersByStatus}
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
                            {t.orders.status[status]}
                          </span>
                          <span
                            className={`font-semibold ${STATUS_COLORS[status]}`}
                            dir="ltr"
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

            {/* Estimated Profit card */}
            {profitEstimate.hasCostData && (
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-medium text-ink-soft">
                    {t.analytics.estimatedProfit}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-clay" dir="ltr">
                    {formatSar(profitEstimate.estimatedProfit, locale)}
                  </p>
                  <p className="mt-2 text-xs text-ink-soft">
                    {formatNumber(profitEstimate.itemsWithCostData)} / {formatNumber(profitEstimate.totalItems)}
                  </p>
                </div>
              </div>
            )}

            {/* Top Products section */}
            <section className="mt-10">
              <h2 className="text-lg font-semibold text-ink">{t.analytics.topProducts}</h2>
              <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* By Quantity Sold */}
                <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-medium text-ink-soft">
                    {t.analytics.byQuantity}
                  </h3>
                  {topProducts.topByQuantity.length === 0 ? (
                    <p className="mt-4 text-sm text-ink-soft">{t.analytics.noData}</p>
                  ) : (
                    <ol className="mt-4 space-y-3">
                      {topProducts.topByQuantity.map((product, index) => (
                        <li
                          key={product.name}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-ink">
                            <span className="me-2 font-semibold text-clay">
                              {index + 1}.
                            </span>
                            {product.name}
                          </span>
                          <span className="text-sm font-semibold text-ink" dir="ltr">
                            {formatNumber(product.quantity)}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>

                {/* By Revenue */}
                <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-medium text-ink-soft">
                    {t.analytics.byRevenue}
                  </h3>
                  {topProducts.topByRevenue.length === 0 ? (
                    <p className="mt-4 text-sm text-ink-soft">{t.analytics.noData}</p>
                  ) : (
                    <ol className="mt-4 space-y-3">
                      {topProducts.topByRevenue.map((product, index) => (
                        <li
                          key={product.name}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-ink">
                            <span className="me-2 font-semibold text-clay">
                              {index + 1}.
                            </span>
                            {product.name}
                          </span>
                          <span className="text-sm font-semibold text-ink" dir="ltr">
                            {formatSar(product.revenue, locale)}
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
                {t.analytics.ordersBySupplier}
              </h2>
              <div className="mt-4 rounded-lg border border-stone-200 bg-white shadow-sm">
                {supplierBreakdown.length === 0 ? (
                  <p className="p-6 text-sm text-ink-soft">{t.analytics.noData}</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 bg-stone-50">
                        <th className="px-6 py-3 font-medium text-ink-soft text-start">
                          {t.analytics.supplier}
                        </th>
                        <th className="px-6 py-3 font-medium text-ink-soft text-start">
                          {t.analytics.orderCount}
                        </th>
                        <th className="px-6 py-3 font-medium text-ink-soft text-start">
                          {t.analytics.revenue}
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
                          <td className="px-6 py-3 text-ink" dir="ltr">
                            {formatNumber(entry.orderCount)}
                          </td>
                          <td className="px-6 py-3 font-semibold text-ink" dir="ltr">
                            {formatSar(entry.revenue, locale)}
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
        <p className="mt-2 text-3xl font-bold text-ink" dir="ltr">{value}</p>
      )}
      {custom}
    </div>
  );
}
