"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLocale } from "@/contexts/LocaleContext";
import { type OrderStatus } from "@/lib/types";
import { formatSar, formatNumber, formatTimestamp, shortOrderId } from "@/lib/format";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  pendingCustomers: number;
}

interface RecentOrder {
  id: string;
  businessName: string;
  total: number;
  status: OrderStatus;
  createdAt: Timestamp | null;
}

export default function DashboardHome() {
  const { t, locale } = useLocale();
  const isAr = locale === "ar";

  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    pendingCustomers: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      // Today's start (midnight local time)
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayTimestamp = Timestamp.fromDate(todayStart);

      // Fetch today's orders
      const todayQuery = query(
        collection(db, "orders"),
        where("createdAt", ">=", todayTimestamp),
        orderBy("createdAt", "desc")
      );
      const todaySnap = await getDocs(todayQuery);
      let todayRevenue = 0;
      todaySnap.forEach((doc) => {
        const data = doc.data();
        if (data.status !== "cancelled") {
          todayRevenue += data.total || 0;
        }
      });

      // Fetch pending orders count
      const pendingQuery = query(
        collection(db, "orders"),
        where("status", "==", "pending")
      );
      const pendingSnap = await getDocs(pendingQuery);

      // Fetch pending customers count
      const pendingCustomersQuery = query(
        collection(db, "users"),
        where("status", "==", "pending"),
        where("role", "==", "customer")
      );
      const pendingCustomersSnap = await getDocs(pendingCustomersQuery);

      // Fetch recent orders (last 5)
      const recentQuery = query(
        collection(db, "orders"),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const recentSnap = await getDocs(recentQuery);
      const recent: RecentOrder[] = [];
      recentSnap.forEach((doc) => {
        const data = doc.data();
        recent.push({
          id: doc.id,
          businessName: data.businessName || "—",
          total: data.total || 0,
          status: (data.status || "pending") as OrderStatus,
          createdAt: data.createdAt || null,
        });
      });

      setStats({
        todayOrders: todaySnap.size,
        todayRevenue,
        pendingOrders: pendingSnap.size,
        pendingCustomers: pendingCustomersSnap.size,
      });
      setRecentOrders(recent);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    }
    setLoading(false);
  }

  const cards = [
    {
      label: isAr ? "طلبات اليوم" : "Today's Orders",
      value: formatNumber(stats.todayOrders),
      href: "/orders",
      color: "text-clay",
    },
    {
      label: isAr ? "إيراد اليوم" : "Today's Revenue",
      value: formatSar(stats.todayRevenue, locale),
      href: "/analytics",
      color: "text-sage",
    },
    {
      label: isAr ? "طلبات معلّقة" : "Pending Orders",
      value: formatNumber(stats.pendingOrders),
      href: "/orders",
      color: stats.pendingOrders > 0 ? "text-clay-deep" : "text-ink",
    },
    {
      label: isAr ? "عملاء بانتظار الموافقة" : "Customers Awaiting Approval",
      value: formatNumber(stats.pendingCustomers),
      href: "/customers",
      color: stats.pendingCustomers > 0 ? "text-clay-deep" : "text-ink",
    },
  ];

  return (
    <div>
      <PageHeader
        title={isAr ? "لوحة التحكم" : "Dashboard"}
        description={isAr ? "ملخص النشاط اليومي" : "Daily activity summary"}
      />
      <div className="p-8 space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-lg border border-stone-200 bg-white p-5 transition-colors hover:border-clay/40 hover:shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                {card.label}
              </p>
              <p className={`mt-2 text-2xl font-bold ${card.color}`}>
                {loading ? "—" : card.value}
              </p>
            </Link>
          ))}
        </div>

        {/* Recent Orders */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">
              {isAr ? "آخر الطلبات" : "Recent Orders"}
            </h2>
            <Link href="/orders" className="text-xs text-clay hover:underline">
              {isAr ? "عرض الكل" : "View all"}
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-ink-soft">{isAr ? "جاري التحميل..." : "Loading..."}</p>
          ) : recentOrders.length === 0 ? (
            <p className="text-sm text-ink-soft">{isAr ? "لا توجد طلبات بعد" : "No orders yet"}</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-ink-soft">
                  <tr>
                    <th className="px-4 py-2.5 text-start font-medium">#</th>
                    <th className="px-4 py-2.5 text-start font-medium">{isAr ? "العميل" : "Customer"}</th>
                    <th className="px-4 py-2.5 text-start font-medium">{isAr ? "المبلغ" : "Amount"}</th>
                    <th className="px-4 py-2.5 text-start font-medium">{isAr ? "الحالة" : "Status"}</th>
                    <th className="px-4 py-2.5 text-start font-medium">{isAr ? "التاريخ" : "Date"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-stone-50">
                      <td className="px-4 py-2.5">
                        <Link href={`/orders/${order.id}`} className="font-mono text-xs text-clay hover:underline">
                          {shortOrderId(order.id)}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-ink">{order.businessName}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-ink" dir="ltr">
                        {formatSar(order.total, locale)}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusPill status={order.status} />
                      </td>
                      <td className="px-4 py-2.5 text-ink-soft text-xs" dir="ltr">
                        {formatTimestamp(order.createdAt, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
