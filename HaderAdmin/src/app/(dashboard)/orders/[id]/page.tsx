"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  type Order,
  type PaymentMethod,
  type PaymentStatus,
  type User,
} from "@/lib/types";
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
import StatusActions from "@/components/StatusActions";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id;
  const { t, isRTL } = useLocale();

  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const unsubscribe = onSnapshot(
      doc(db, "orders", orderId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setOrder(null);
          setNotFound(true);
          setLoading(false);
          return;
        }
        setOrder({ id: snapshot.id, ...snapshot.data() } as Order);
        setNotFound(false);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Failed to load order:", err);
        setError(t.orders.loadError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId, t.orders.loadError]);

  useEffect(() => {
    const customerId = order?.customerId;
    if (!customerId) return;

    let cancelled = false;
    getDoc(doc(db, "users", customerId))
      .then((snapshot) => {
        if (cancelled || !snapshot.exists()) return;
        setCustomer({ id: snapshot.id, ...snapshot.data() } as User);
      })
      .catch((err) => {
        console.warn("Could not load customer details:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [order?.customerId]);

  const backArrow = isRTL ? "→" : "←";

  return (
    <div>
      <PageHeader
        title={t.orders.detail.title}
        action={
          <Link
            href="/orders"
            className="text-sm font-medium text-clay hover:text-clay-deep hover:underline"
          >
            {backArrow} {t.orders.detail.backToOrders}
          </Link>
        }
      />
      <div className="p-8">
        <OrderDetailContent
          order={order}
          customer={customer}
          loading={loading}
          notFound={notFound}
          error={error}
        />
      </div>
    </div>
  );
}

function OrderDetailContent({
  order,
  customer,
  loading,
  notFound,
  error,
}: {
  order: Order | null;
  customer: User | null;
  loading: boolean;
  notFound: boolean;
  error: string | null;
}) {
  const { t, isRTL } = useLocale();
  const backArrow = isRTL ? "→" : "←";

  if (loading) {
    return <p className="text-ink-soft">{t.general.loading}</p>;
  }

  if (error) {
    return <p className="text-clay-deep">{error}</p>;
  }

  if (notFound || !order) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-12 text-center">
        <p className="text-ink">{t.general.error}</p>
        <Link
          href="/orders"
          className="mt-4 inline-block text-sm font-medium text-clay hover:text-clay-deep hover:underline"
        >
          {backArrow} {t.orders.detail.backToOrders}
        </Link>
      </div>
    );
  }

  const isCancelled = order.status === "cancelled";

  return (
    <div className="space-y-6">
      {isCancelled && (
        <div
          className="flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 px-5 py-3"
          role="status"
          data-testid="cancelled-banner"
        >
          <span className="text-lg" aria-hidden="true">✕</span>
          <p className="text-sm font-medium text-stone-500">
            {t.orders.status.cancelled}
          </p>
        </div>
      )}

      <div className={isCancelled ? "opacity-75" : ""}>
        <OrderSummaryCard order={order} />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <LineItemsCard order={order} />
          </div>
          <div className="space-y-6">
            <DeliveryAddressCard order={order} />
            <PaymentInfoCard order={order} />
            <CustomerInfoCard order={order} customer={customer} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-stone-200 bg-white">
      <h2 className="border-b border-stone-200 bg-stone-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-ink-soft">
        {title}
      </h2>
      <div className="p-5">{children}</div>
    </section>
  );
}

function OrderSummaryCard({ order }: { order: Order }) {
  const { t } = useLocale();
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg text-ink" dir="ltr">
              #{shortOrderId(order.id)}
            </span>
            <StatusPill status={order.status} />
          </div>
          <p className="mt-1 text-xl font-bold text-ink">{order.businessName}</p>
          <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-ink-soft">{t.orders.table.created}</dt>
              <dd className="text-ink" dir="ltr">{formatTimestamp(order.createdAt)}</dd>
            </div>
          </dl>
        </div>

        <div className="flex items-center gap-2" aria-label={t.orders.detail.updateStatus} data-testid="status-actions">
          <StatusActions orderId={order.id} currentStatus={order.status} />
        </div>
      </div>
    </section>
  );
}

function LineItemsCard({ order }: { order: Order }) {
  const { t } = useLocale();
  const items = order.items ?? [];

  return (
    <Card title={t.orders.detail.orderItems}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-200 text-xs uppercase tracking-wide text-ink-soft">
            <tr>
              <th className="py-2 pe-4 font-medium text-start">{t.catalog.products.title}</th>
              <th className="py-2 pe-4 font-medium text-start">{t.catalog.products.pricingUnit}</th>
              <th className="py-2 pe-4 font-medium text-end">{t.orders.detail.unitPrice}</th>
              <th className="py-2 pe-4 font-medium text-end">{t.orders.detail.quantity}</th>
              <th className="py-2 font-medium text-end">{t.orders.detail.lineTotal}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {items.map((item, index) => (
              <tr key={`${item.productId}-${index}`}>
                <td className="py-3 pe-4">
                  <span className="text-ink">{item.name}</span>
                  {item.variantLabel && (
                    <span className="ms-2 rounded bg-stone-100 px-1.5 py-0.5 text-xs text-ink-soft">
                      {item.variantLabel}
                    </span>
                  )}
                </td>
                <td className="py-3 pe-4 text-ink-soft">{item.pricingUnitLabel}</td>
                <td className="py-3 pe-4 text-end text-ink" dir="ltr">{formatSar(item.unitPrice)}</td>
                <td className="py-3 pe-4 text-end text-ink" dir="ltr">{formatNumber(item.quantity)}</td>
                <td className="py-3 text-end text-ink" dir="ltr">{formatSar(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-stone-200">
            <tr>
              <td colSpan={4} className="py-2 pe-4 text-end text-ink-soft">
                {t.orders.table.total}
              </td>
              <td className="py-2 text-end text-base font-bold text-ink" dir="ltr">
                {formatSar(order.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}

function DeliveryAddressCard({ order }: { order: Order }) {
  const { t } = useLocale();
  const address = order.deliveryAddress;

  if (!address) {
    return (
      <Card title={t.orders.detail.deliveryAddress}>
        <p className="text-sm text-ink-soft">—</p>
      </Card>
    );
  }

  return (
    <Card title={t.orders.detail.deliveryAddress}>
      <dl className="space-y-2 text-sm">
        <Field label={t.orders.detail.district} value={address.district} />
        {address.street && <Field label={t.orders.detail.street} value={address.street} />}
        {address.notes && <Field label={t.orders.detail.notes} value={address.notes} />}
      </dl>
      <a
        href={googleMapsSearchUrl(address.lat, address.lng)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-clay px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-clay-deep"
      >
        {t.orders.detail.viewOnMap}
      </a>
    </Card>
  );
}

function PaymentInfoCard({ order }: { order: Order }) {
  const { t } = useLocale();

  const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    apple_pay: t.orders.payment.apple_pay,
    cash_on_delivery: t.orders.payment.cash_on_delivery,
  };

  return (
    <Card title={t.orders.detail.paymentMethod}>
      <dl className="space-y-2 text-sm">
        <Field
          label={t.orders.detail.paymentMethod}
          value={PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
        />
      </dl>
    </Card>
  );
}

function CustomerInfoCard({ order, customer }: { order: Order; customer: User | null }) {
  const { t } = useLocale();

  return (
    <Card title={t.nav.customers}>
      <dl className="space-y-2 text-sm">
        <Field label={t.customers.fields.businessName} value={order.businessName} />
        {customer?.contactName && (
          <Field label={t.customers.fields.contactName} value={customer.contactName} />
        )}
        {customer?.phone && <Field label={t.customers.fields.phone} value={customer.phone} />}
        {customer?.email && <Field label={t.customers.fields.email} value={customer.email} />}
      </dl>
    </Card>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-ink-soft">{label}</dt>
      <dd className={`text-end text-ink ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
