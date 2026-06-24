"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type Order, type OrderStatus } from "@/lib/types";
import {
  formatSar,
  formatNumber,
  formatTimestamp,
  googleMapsSearchUrl,
  shortOrderId,
} from "@/lib/format";
import { useLocale } from "@/contexts/LocaleContext";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";

/** Filter options for the orders list. */
type StatusFilter = "all" | "active" | "cancelled";

/** Statuses considered "active" (in-progress, actionable). */
const ACTIVE_STATUSES: OrderStatus[] = ["pending", "sent_to_supplier"];

function filterOrders(orders: Order[], filter: StatusFilter): Order[] {
  switch (filter) {
    case "active":
      return orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
    case "cancelled":
      return orders.filter((o) => o.status === "cancelled");
    default:
      return orders;
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const { t } = useLocale();

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

  const filteredOrders = filterOrders(orders, statusFilter);

  const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
    all: t.orders.filters.all,
    active: t.orders.filters.active,
    cancelled: t.orders.filters.cancelled,
  };

  return (
    <div>
      <PageHeader
        title={t.orders.title}
        description={t.orders.description}
      />
      <div className="p-4 sm:p-8">
        {/* Status filter tabs */}
        <div className="mb-4 flex gap-1 rounded-lg bg-stone-100 p-1 w-fit overflow-x-auto">
          {(Object.keys(STATUS_FILTER_LABELS) as StatusFilter[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === key
                  ? "bg-white text-ink shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {STATUS_FILTER_LABELS[key]}
            </button>
          ))}
        </div>

        <OrdersContent orders={filteredOrders} loading={loading} error={error} />
      </div>
    </div>
  );
}

function OrdersContent({
  orders,
  loading,
  error,
}: {
  orders: Order[];
  loading: boolean;
  error: string | null;
}) {
  const { t } = useLocale();

  if (loading) {
    return <p className="text-ink-soft">{t.general.loading}</p>;
  }

  if (error) {
    return <p className="text-clay-deep">{error}</p>;
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-12 text-center">
        <p className="text-ink-soft">{t.orders.empty}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
      <table className="w-full min-w-[700px] text-sm" dir="auto">
        <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            <th className="px-4 py-3 font-medium text-start">{t.orders.table.order}</th>
            <th className="px-4 py-3 font-medium text-start">{t.orders.table.business}</th>
            <th className="px-4 py-3 font-medium text-start">{t.orders.table.items}</th>
            <th className="px-4 py-3 font-medium text-start">{t.orders.table.total}</th>
            <th className="px-4 py-3 font-medium text-start">{t.orders.table.payment}</th>
            <th className="px-4 py-3 font-medium text-start">{t.orders.table.status}</th>
            <th className="px-4 py-3 font-medium text-start">{t.orders.table.created}</th>
            <th className="px-4 py-3 font-medium text-start">{t.orders.table.location}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {orders.map((order) => {
            const itemCount = (order.items ?? []).reduce(
              (sum, item) => sum + (item.quantity ?? 0),
              0
            );
            const { lat, lng } = order.deliveryAddress ?? { lat: 0, lng: 0 };
            const isCancelled = order.status === "cancelled";

            return (
              <tr
                key={order.id}
                className={`hover:bg-stone-50 ${isCancelled ? "opacity-50" : ""}`}
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/orders/${order.id}`}
                    className="font-mono text-clay hover:text-clay-deep hover:underline"
                    dir="ltr"
                  >
                    {shortOrderId(order.id)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink">{order.businessName}</td>
                <td className="px-4 py-3 text-ink-soft" dir="ltr">
                  {formatNumber(itemCount)}
                </td>
                <td className="px-4 py-3 text-ink" dir="ltr">{formatSar(order.total)}</td>
                <td className="px-4 py-3 text-ink-soft">
                  {t.orders.payment[order.paymentMethod as keyof typeof t.orders.payment] ??
                    order.paymentMethod}
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={order.status} />
                </td>
                <td className="px-4 py-3 text-ink-soft" dir="ltr">
                  {formatTimestamp(order.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={googleMapsSearchUrl(lat, lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-clay hover:text-clay-deep hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t.orders.table.map}
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
