import { type Timestamp } from "firebase/firestore";

/**
 * Shared Firestore data-model types for the admin dashboard.
 *
 * These mirror the collections defined in Phase1-Architecture.md §2 and are
 * shared with the iOS app. They are intended to be reused across the orders,
 * catalog, suppliers, customers, and analytics features.
 */

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

/** Lifecycle status of an order, set manually by the admin. */
export type OrderStatus =
  | "pending"
  | "sent_to_supplier"
  | "delivered"
  | "cancelled";

/** How the customer chose to pay. */
export type PaymentMethod = "apple_pay" | "cash_on_delivery";

/** Settlement state of the order payment. */
export type PaymentStatus = "paid" | "pending" | "cod_unpaid";

/** Delivery destination captured at checkout, including map coordinates. */
export interface DeliveryAddress {
  city: string;
  district: string;
  street?: string;
  notes?: string;
  lat: number;
  lng: number;
}

/** A single line item within an order. */
export interface OrderLineItem {
  productId: string;
  name: string;
  variantLabel?: string;
  pricingUnitLabel: string;
  unitPrice: number;
  costPrice?: number;
  quantity: number;
  lineTotal: number;
}

/** A customer order document from the `orders` collection. */
export interface Order {
  id: string;
  customerId: string;
  businessName: string;
  deliveryAddress: DeliveryAddress;
  items: OrderLineItem[];
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  supplierId?: string | null;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// ---------------------------------------------------------------------------
// Bilingual content
// ---------------------------------------------------------------------------

/** A field carrying both Arabic and English text. */
export interface BilingualText {
  ar: string;
  en: string;
}

// ---------------------------------------------------------------------------
// Catalog: categories, products, variants
// ---------------------------------------------------------------------------

/** A product category from the `categories` collection. */
export interface Category {
  id: string;
  name: BilingualText;
  sortOrder: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/** A purchasable variant of a product (e.g. a specific size or grind). */
export interface ProductVariant {
  id: string;
  label: BilingualText;
  pricingUnitLabel: string;
  price: number;
  costPrice?: number;
  stock: number;
  available: boolean;
}

/** A product document from the `products` collection. */
export interface Product {
  id: string;
  categoryId: string;
  name: BilingualText;
  description?: BilingualText;
  pricingUnitLabel: string;
  price: number;
  costPrice?: number;
  available: boolean;
  madeToOrder: boolean;
  deliveryEstimate?: string;
  imageUrl?: string;
  supplierId?: string | null;
  variants?: ProductVariant[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ---------------------------------------------------------------------------
// Suppliers
// ---------------------------------------------------------------------------

/** A supplier document from the `suppliers` collection. */
export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  handlesNote?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ---------------------------------------------------------------------------
// Users / customers
// ---------------------------------------------------------------------------

/** Onboarding/approval status of a customer account. */
export type UserStatus = "pending" | "approved" | "suspended";

/** Role assigned to a user account. */
export type UserRole = "admin" | "customer";

/** A user document from the `users` collection. */
export interface User {
  id: string;
  businessName: string;
  contactName?: string;
  phone?: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  deliveryAddress?: DeliveryAddress;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
