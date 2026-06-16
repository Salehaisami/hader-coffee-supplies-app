# Bulk Supplies Ordering App — Phase One Data Models & Architecture

*Companion to Phase1-Requirements.md*

---

## 1. System Architecture

```
┌─────────────────┐         ┌──────────────────┐
│   iOS App        │        │  Admin Web App    │
│  (Swift/SwiftUI) │        │  (React/Next.js)  │
└────────┬─────────┘        └─────────┬─────────┘
         │                            │
         │      Firebase SDK / calls  │
         └──────────────┬─────────────┘
                        │
         ┌──────────────▼──────────────┐
         │          Firebase            │
         │  ┌────────────────────────┐  │
         │  │ Auth (customers/admins)│  │
         │  ├────────────────────────┤  │
         │  │ Firestore (data)       │  │
         │  ├────────────────────────┤  │
         │  │ Storage (product images)│ │
         │  ├────────────────────────┤  │
         │  │ Cloud Functions        │  │
         │  │  - new order → notify  │  │
         │  │  - approval workflows  │  │
         │  └────────────────────────┘  │
         └──────────────┬──────────────┘
                        │ (manual, admin-triggered)
                        ▼
            WhatsApp Business / Email → Supplier
```

**Notes**
- The iOS app and admin web app share the same Firebase project.
- Supplier routing is manual: admin reads the order in the dashboard and forwards it via WhatsApp/email. No supplier-side integration in Phase One.
- Cloud Functions handle server-side concerns: notifying admin of new orders, optionally sending order-confirmation emails, and enforcing approval state.

## 2. Firestore Data Model

Firestore is document-based. Below, each top-level collection is described with its key fields. `→` denotes a reference to another document.

### 2.1 `users`
One document per customer (coffee shop / cafe) account.

| Field | Type | Notes |
|---|---|---|
| `uid` | string | Firebase Auth UID (doc ID) |
| `businessName` | string | |
| `contactName` | string | |
| `phone` | string | |
| `email` | string | |
| `deliveryAddress` | map | city (Jeddah only in P1), district, street/building, notes, `lat`, `lng` (verified pin coordinates) |
| `role` | string | `customer` or `admin` |
| `status` | string | `pending`, `approved`, `suspended` — does not block ordering |
| `createdAt` | timestamp | |

### 2.2 `categories`
| Field | Type | Notes |
|---|---|---|
| `id` | string | doc ID |
| `name_ar` / `name_en` | string | bilingual; Arabic shown by default |
| `sortOrder` | number | controls display order |
| `iconUrl` | string | optional |

### 2.3 `products`
A **single base schema for all items.** Every product shares the same core fields. Items that come in sizes/options (cups, lids, straws) populate an optional `variants` array; all other items leave it empty and use the top-level price/stock. One collection, one card component, one product screen — the variant selector only renders when `variants` is non-empty.

**Base fields (all products):**

| Field | Type | Notes |
|---|---|---|
| `id` | string | doc ID |
| `name_ar` / `name_en` | string | bilingual; Arabic default |
| `description_ar` / `description_en` | string | bilingual |
| `imageUrl` | string | from Firebase Storage |
| `categoryId` | string | → `categories` |
| `pricingUnit` | string | e.g. `dozen`, `case_of_50`, `pack` |
| `pricingUnitLabel` | string | human label, e.g. "per dozen" |
| `hasVariants` | boolean | true → use `variants`; false → use base price/stock below |
| `sellPrice` | number | base price (used when `hasVariants` = false) |
| `deliveryEstimate` | string | e.g. "2–4 days" |
| `inStock` | boolean | base stock flag (used when `hasVariants` = false) |
| `madeToOrder` | boolean | true for printing/custom items (longer lead time) |
| `activeSupplierIndex` | number | index into `suppliers`; 0 in Phase One |
| `suppliers` | array<map> | single entry in Phase One (see below) |
| `variants` | array<map> | empty for simple items; populated for cups/lids/straws |
| `createdAt` / `updatedAt` | timestamp | |

**`variants` array element (map) — only for sized/optioned items:**

| Field | Type | Notes |
|---|---|---|
| `variantId` | string | stable id within the product |
| `label_ar` / `label_en` | string | e.g. "8oz", "كبير"/"Large" |
| `sellPrice` | number | price for this variant |
| `pricingUnit` / `pricingUnitLabel` | string | can differ per variant |
| `inStock` | boolean | per-variant availability |
| `costPrice` | number? | optional, per variant, for profit tracking |

**`suppliers` array element (map):**

| Field | Type | Notes |
|---|---|---|
| `supplierId` | string | → `suppliers` collection |
| `costPrice` | number? | optional; for profit tracking (base/simple items) |
| `sellPrice` | number | this supplier's customer price |
| `pricingUnit` | string | |
| `deliveryEstimate` | string | |

*Design notes: (1) one base schema avoids two "kinds" of product across catalog, cart, and admin. (2) `variants` is an optional dimension layered on top, exactly like Shopify. (3) `suppliers` stays an array so multi-supplier is a later UI change, not a migration.*

### 2.4 `suppliers`
| Field | Type | Notes |
|---|---|---|
| `id` | string | doc ID |
| `name` | string | |
| `phone` | string | for WhatsApp routing |
| `email` | string | |
| `handlesNote` | string | free text: categories/products they cover |
| `createdAt` | timestamp | |

### 2.5 `orders`
| Field | Type | Notes |
|---|---|---|
| `id` | string | doc ID |
| `customerId` | string | → `users` |
| `businessName` | string | denormalized for quick display |
| `deliveryAddress` | map | snapshot at order time, including `lat`/`lng` pin coordinates |
| `items` | array<map> | line items (snapshot) |
| `subtotal` | number | |
| `total` | number | |
| `paymentMethod` | string | `apple_pay` or `cash_on_delivery` |
| `paymentStatus` | string | `paid`, `pending`, `cod_unpaid` |
| `status` | string | `pending`, `sent_to_supplier`, `delivered` |
| `supplierId` | string? | which supplier it was routed to |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

**`items` array element (map) — snapshot at purchase time:**

| Field | Type | Notes |
|---|---|---|
| `productId` | string | reference |
| `name` | string | snapshot |
| `variantLabel` | string? | snapshot of chosen variant, e.g. "12oz" (null if simple item) |
| `pricingUnitLabel` | string | snapshot |
| `unitPrice` | number | snapshot (price won't change retroactively) |
| `costPrice` | number? | snapshot for profit calc |
| `quantity` | number | in selling units |
| `lineTotal` | number | |

*Order line items are snapshots, not live references — so later price changes don't alter historical orders or profit figures.*

## 3. Authentication & Roles
- Single Firebase Auth pool; `role` field distinguishes `customer` vs `admin`.
- Customers: **phone OTP** sign-in (low-friction, common in the region).
- **Customers can check out immediately after signing up** — no approval gate blocks ordering. New accounts start with `status: pending` and the admin reviews/approves in the background; ordering is not blocked while pending.
- Admins: access the web dashboard only; locked down by Firestore Security Rules and/or custom claims.

## 4. Firestore Security Rules (high level)
- `products`, `categories`: public read; write admin-only.
- `users`: a user can read/write their own doc; admins can read/write all.
- `orders`: a customer can create and read their own orders; admins read/write all; status field writable by admins only.
- `suppliers`: admin-only read/write (never exposed to the app).

## 5. Cloud Functions (Phase One)
- **onOrderCreate** → notify admin via **both push and email** of a new order.
- **onUserCreate** → set default `status: pending` and `role: customer` (pending does not block ordering; it's for admin review only).
- (Optional) order-confirmation email to the customer.

## 6. Image / Asset Handling
- Product images stored in Firebase Storage; `imageUrl` saved on the product doc.
- Admin uploads/replaces images from the dashboard.

## 6a. Localization (Arabic-Native)
- App defaults to **Arabic with RTL layout**; English (LTR) is a secondary toggle stored in user prefs / device locale.
- UI strings via iOS `Localizable.strings` (ar + en). Catalog content stored bilingually (`*_ar` / `*_en` fields) with Arabic shown by default.
- Admin dashboard catalog editor must capture both Arabic and English for names/descriptions/variant labels.

## 7. Payments Integration Notes
- **Apple Pay:** integrated client-side on iOS; on success, write the order with `paymentStatus: paid`. Be mindful of per-transaction limits for large bulk orders.
- **Cash on Delivery:** order created with `paymentStatus: cod_unpaid`; reconciled manually on delivery.
- No card data is stored anywhere.

## 7a. Location & Delivery Zone Validation
- **Location capture:** request location permission at checkout and auto-locate the customer using Core Location.
- **Draggable map pin:** display a map with a draggable pin so the customer marks the exact building entrance. **MapKit** is used for the in-app picker only (native and free on iOS); the value persisted is **raw `lat`/`lng` numbers**, never an Apple-specific object. Coordinates are map-agnostic and reusable by any navigation app.
- **Navigation for drivers:** Google Maps is the common navigation app in Saudi. The admin dashboard and order records expose a **Google Maps deep link** generated from the stored coordinates — `https://www.google.com/maps/search/?api=1&query=LAT,LNG` (Waze/Apple Maps links can be added the same way). Capture tool (MapKit) and navigation tool (Google Maps) are deliberately decoupled.
- *(Optional) using the Google Maps SDK for the in-app picker would show customers a familiar map but adds an API key and possible cost — deferred in favor of free MapKit + map-agnostic coordinates.*
- **Jeddah geofence:** validate the pinned coordinates against Jeddah's boundary (polygon, or center-point + radius) before allowing checkout. Out-of-zone → checkout blocked with a clear message.
- **Source of truth:** coordinates (pin) are authoritative for delivery; the city/district selector and free-text fields are supporting labels for the driver and admin.
- **Accuracy caveat:** GPS yields coordinates, not a verified national address, and degrades indoors — the draggable pin lets the customer correct it.
- **Phase Two:** integrate the Saudi National Address (SPL) API as a verified-address layer on top of coordinates. SPL API terms/pricing/onboarding to be confirmed before committing.

## 8. Open / TBD
- Customer auth method: **resolved — phone OTP.**
- Admin notification channel: **resolved — both push and email.**
- Whether to send automated customer order-confirmation emails (or SMS, given phone-based accounts) in Phase One.
