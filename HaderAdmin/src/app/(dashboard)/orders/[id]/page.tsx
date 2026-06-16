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
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import StatusActions from "@/components/StatusActions";

/** Human-readable labels for payment methods. */
const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  apple_pay: "Apple Pay",
  cash_on_delivery: "Cash on Delivery",
};

/** Human-readable labels for payment settlement status. */
const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  cod_unpaid: "Cash on Delivery — Unpaid",
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time listener on the single order doc so status changes reflect live.
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
        setError("Could not load this order. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  // Best-effort fetch of the customer doc for contact details (nice to have).
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
        // Contact details are optional; log but don't surface an error.
        console.warn("Could not load customer details:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [order?.customerId]);

  return (
    <div>
      <PageHeader
        title="Order Detail"
        description="Review line items, delivery, and payment for this order."
        action={
          <Link
            href="/orders"
            className="text-sm font-medium text-clay hover:text-clay-deep hover:underline"
          >
            ← Back to orders
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
  if (loading) {
    return <p className="text-ink-soft">Loading order…</p>;
  }

  if (error) {
    return <p className="text-clay-deep">{error}</p>;
  }

  if (notFound || !order) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-12 text-center">
        <p className="text-ink">This order could not be found.</p>
        <p className="mt-1 text-sm text-ink-soft">
          It may have been removed, or the link may be incorrect.
        </p>
        <Link
          href="/orders"
          className="mt-4 inline-block text-sm font-medium text-clay hover:text-clay-deep hover:underline"
        >
          ← Back to orders
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
          <span className="text-lg" aria-hidden="true">
            ✕
          </span>
          <p className="text-sm font-medium text-stone-500">
            This order was cancelled. All details are read-only.
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

/** Reusable card shell with a heading. */
function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-stone-200 bg-white">
      <h2 className="border-b border-stone-200 bg-stone-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-ink-soft">
        {title}
      </h2>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Header summary: short id, business name, status, and dates + actions slot. */
function OrderSummaryCard({ order }: { order: Order }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg text-ink">
              #{shortOrderId(order.id)}
            </span>
            <StatusPill status={order.status} />
          </div>
          <p className="mt-1 text-xl font-bold text-ink">{order.businessName}</p>
          <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-ink-soft">Created</dt>
              <dd className="text-ink">{formatTimestamp(order.createdAt)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-ink-soft">Updated</dt>
              <dd className="text-ink">{formatTimestamp(order.updatedAt)}</dd>
            </div>
          </dl>
        </div>

        <div
          className="flex items-center gap-2"
          aria-label="Status actions"
          data-testid="status-actions"
        >
          <StatusActions orderId={order.id} currentStatus={order.status} />
        </div>
      </div>
    </section>
  );
}

/** Line items table with subtotal and total. */
function LineItemsCard({ order }: { order: Order }) {
  const items = order.items ?? [];

  return (
    <Card title="Line items">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 text-xs uppercase tracking-wide text-ink-soft">
            <tr>
              <th className="py-2 pr-4 font-medium">Item</th>
              <th className="py-2 pr-4 font-medium">Unit</th>
              <th className="py-2 pr-4 text-right font-medium">Unit price</th>
              <th className="py-2 pr-4 text-right font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Line total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {items.map((item, index) => (
              <tr key={`${item.productId}-${index}`}>
                <td className="py-3 pr-4">
                  <span className="text-ink">{item.name}</span>
                  {item.variantLabel && (
                    <span className="ml-2 rounded bg-stone-100 px-1.5 py-0.5 text-xs text-ink-soft">
                      {item.variantLabel}
                    </span>
                  )}
                </td>
                <td className="py-3 pr-4 text-ink-soft">
                  {item.pricingUnitLabel}
                </td>
                <td className="py-3 pr-4 text-right text-ink">
                  {formatSar(item.unitPrice)}
                </td>
                <td className="py-3 pr-4 text-right text-ink">
                  {formatNumber(item.quantity)}
                </td>
                <td className="py-3 text-right text-ink">
                  {formatSar(item.lineTotal)}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-ink-soft">
                  No line items on this order.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="border-t border-stone-200">
            <tr>
              <td colSpan={4} className="py-2 pr-4 text-right text-ink-soft">
                Subtotal
              </td>
              <td className="py-2 text-right text-ink">
                {formatSar(order.subtotal)}
              </td>
            </tr>
            <tr>
              <td
                colSpan={4}
                className="py-2 pr-4 text-right font-semibold text-ink"
              >
                Total
              </td>
              <td className="py-2 text-right text-base font-bold text-ink">
                {formatSar(order.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}

/** Delivery address block with a prominent Google Maps deep link. */
function DeliveryAddressCard({ order }: { order: Order }) {
  const address = order.deliveryAddress;

  if (!address) {
    return (
      <Card title="Delivery address">
        <p className="text-sm text-ink-soft">No delivery address on file.</p>
      </Card>
    );
  }

  return (
    <Card title="Delivery address">
      <dl className="space-y-2 text-sm">
        <Field label="City" value={address.city} />
        <Field label="District" value={address.district} />
        {address.street && <Field label="Street" value={address.street} />}
        {address.notes && <Field label="Notes" value={address.notes} />}
      </dl>
      <a
        href={googleMapsSearchUrl(address.lat, address.lng)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-clay px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-clay-deep"
      >
        Open in Google Maps
      </a>
    </Card>
  );
}

/** Payment method and settlement status. */
function PaymentInfoCard({ order }: { order: Order }) {
  return (
    <Card title="Payment">
      <dl className="space-y-2 text-sm">
        <Field
          label="Method"
          value={
            PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod
          }
        />
        <Field
          label="Status"
          value={
            PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus
          }
        />
      </dl>
    </Card>
  );
}

/** Customer business info plus optional contact details from the user doc. */
function CustomerInfoCard({
  order,
  customer,
}: {
  order: Order;
  customer: User | null;
}) {
  return (
    <Card title="Customer">
      <dl className="space-y-2 text-sm">
        <Field label="Business" value={order.businessName} />
        {customer?.contactName && (
          <Field label="Contact" value={customer.contactName} />
        )}
        {customer?.phone && <Field label="Phone" value={customer.phone} />}
        {customer?.email && <Field label="Email" value={customer.email} />}
        <Field label="Customer ID" value={order.customerId} mono />
      </dl>
    </Card>
  );
}

/** A label/value row used inside info cards. */
function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-ink-soft">{label}</dt>
      <dd className={`text-right text-ink ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
