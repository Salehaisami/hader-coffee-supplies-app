# Bulk Supplies Ordering App — Phase One Requirements

*B2B e-commerce app for cafes / coffee shops in Jeddah, Saudi Arabia*

---

## 1. Overview

A mobile app that lets coffee shop / cafe managers and owners in Jeddah order standard supplies (cups, lids, straws, sleeves, napkins, printing, etc.) in bulk through a fast, polished, few-step flow. Orders are fulfilled manually: the admin receives each order, routes it to the appropriate supplier via WhatsApp Business or email, and manually updates the order status in the app.

**Core principles for Phase One:**
- Ruthlessly simple MVP, but design and polish are a top priority (the Saudi market expects slick, intuitive apps).
- **Arabic-native: Arabic is the default language with full right-to-left (RTL) layout.** English is offered as a secondary language. All screens, copy, components, and the catalog support both, with Arabic as the primary experience.
- Customers order **only** from a curated standard catalog. No custom item requests.
- Multiple suppliers supported from day one (flexible onboarding; suppliers may not have organized inventory).
- Fulfillment and status updates are manual.

## 2. Platform & Tech Stack

| Layer | Choice |
|---|---|
| Mobile app | Native iOS (Swift / SwiftUI) |
| Backend | Firebase (Firestore, Auth, Cloud Functions, Storage) |
| Admin dashboard | Separate web app (React or Next.js) |
| Payments | Apple Pay + Cash on Delivery |
| Supplier routing | Manual via WhatsApp Business / email |

## 3. User Types

1. **Customer** — coffee shop / cafe managers and owners in Jeddah who browse and order.
2. **Admin** — you/your team, managing catalog, orders, suppliers, and fulfillment via the web dashboard.

## 4. Customer App — Flows & Requirements

### 4.1 Onboarding
- 2–3 minimal swipeable screens shown **once per install** (first launch only).
- Suggested content: (1) what the app is — bulk supplies for coffee shops; (2) ordering is fast and easy; (3) track your shipments.
- Skippable. Logged-in users skip onboarding entirely and land on the catalog.

### 4.2 Catalog Browsing (Guest Allowed)
- No login required to browse — reduces friction for first-time explorers.
- Products organized into simple **categories** (e.g. cups, lids, straws, holders, napkins, printing).
- Reusable, polished **product card component** used consistently across the catalog (image, name, price, add-to-cart).
- Implementer task: at project start, generate a sensible default list of standard coffee shop supply items to seed the catalog.
- A profile/account icon is always visible. Tapping it:
  - Guest → login / sign-up screen.
  - Logged in → account details.

### 4.3 Product Detail
- Image, name, description, price, category.
- **All items share one base layout.** Items with sizes/options (cups, lids, straws) show a **variant selector** (e.g. 8oz / 12oz / 16oz) that updates the displayed price and availability. Items without variants simply don't show a selector.
- **Pricing unit:** price is shown per selling unit (e.g. per dozen, per case, per bulk pack), not per single piece. The unit label varies by item/variant and is set in the backend (e.g. "SAR 48 / dozen"). Display must make the unit obvious and intuitive.
- **Delivery estimate:** each item shows an estimated delivery timeline. Made-to-order items (e.g. custom printing) show a longer estimate and a clear note.
- The customer always sees a **single price and single delivery estimate** per item/variant — supplier complexity is never exposed. (In Phase One there is one supplier per item anyway; see §6.1.)
- All product data tied to the catalog stored in Firestore (admin-editable).
- Add to cart with quantity (quantity is in selling units; for variant items, the selected variant is added).

### 4.4 Cart
- Cart icon shows item-count badge.
- Cart screen lists items with quantity, unit price, line totals, and an order total.
- Adjust quantities or remove items.

### 4.5 Authentication
- Triggered at checkout (guests prompted to sign in or sign up).
- **Phone OTP** sign-in — low friction, common in the region.
- Returning/logged-in users are not re-prompted.
- Account creation captures business name, contact phone, email, delivery address.
- New accounts can **check out immediately** (status starts as `pending` for admin review but does not block ordering).

### 4.6 Checkout
- Enter / confirm delivery details:
  - **Location capture (primary):** request location permission, auto-locate the customer, and show a **draggable map pin** so they place it on the exact building entrance. The pin's **raw latitude/longitude** are saved as the delivery target. MapKit is used only to *display* the picker in-app; what is stored is plain coordinates, which are map-agnostic and work in Google Maps, Waze, or Apple Maps alike.
  - **Jeddah geofence check:** the pinned coordinates are validated against Jeddah's boundary. If outside Jeddah, checkout is blocked with a clear message (Jeddah-only for now).
  - **City/district selector** (controlled list, Jeddah districts) and free-text street / building / additional details, used to support and label the pin — not as the source of truth.
  - Business name and phone.
- **Saved location reuse:** a business's verified pin/coordinates are stored once and reused on future orders to reduce friction (editable if they move).
- **Delivery is Jeddah-only in Phase One**, enforced by the geofence on real coordinates rather than a dropdown alone. Expanding coverage later = widening the geofence / adding cities.
- Choose payment method:
  - **Apple Pay** (note: device/region transaction limits exist; acceptable for MVP, revisit with Stripe later if needed).
  - **Cash on Delivery** (important — avoids losing customers who prefer cash).
- On success, the order is written to Firestore (including delivery coordinates) and the admin is notified. The admin view / order record exposes a **Google Maps link** built from the coordinates (`https://www.google.com/maps/search/?api=1&query=LAT,LNG`) so drivers navigate in the app they actually use.

*Note on accuracy: GPS gives coordinates, not a verified national address, and degrades indoors — the draggable pin lets the customer correct it, and coordinates are often more useful to a driver than a formatted address. SPL National Address verification remains a Phase Two layer.*

### 4.7 Order Tracking & History
- Order statuses (kept simple for manual ops): **Pending → Sent to Supplier → Delivered**.
- Customers can view current status of active orders.
- Order history: past orders with date, items, total, and status.

## 5. Admin Dashboard — Flows & Requirements

### 5.1 Order Management
- View incoming orders with customer details and ordered items.
- Manually update order status (Pending / Sent to Supplier / Delivered).
- Notification when a new order arrives (e.g. Cloud Function → email/push).

### 5.2 Catalog Management
- Add new items, edit names/descriptions/images, update prices, set categories.
- Set the **pricing unit / bulk quantity** per item (e.g. per dozen, per case of 50) — drives how price is displayed to the customer.
- **Customer sell price** per item (what the customer pays). For variant items (cups/lids/straws), set price and stock **per variant** (e.g. 8oz / 12oz / 16oz).
- **Variants:** add/edit/remove size or option variants on items that need them; simple items have none. All items use the same base editor — variants are an optional section.
- **Supplier info** per item: at launch, a single supplier per item. Minimal required fields — supplier name and contact (phone/email) and a delivery timeline are enough to start.
- **Optional supplier cost price** per item — what the supplier charges us. Optional/hideable field used internally for profit tracking (sell price − cost). Can be left blank and backfilled later.
- Toggle item availability (in stock / out of stock) — manually controlled.
- Changes sync to the live app.
- *Data is structured so a single item can later hold multiple supplier entries (see §6.1), but the Phase One UI only handles one supplier per item to keep data entry light.*

### 5.3 Supplier Management (kept simple)
- Store supplier name, contact info (phone, email), and a note on what categories/products they handle.
- Used to decide where to route each order.

### 5.4 Customer / Account Onboarding
- Self-registration via phone OTP; customers can order immediately.
- Admin reviews/approves new accounts in the background (does not block ordering) for quality control and follow-up.
- Admin can also manually create accounts when onboarding customers directly.

### 5.5 Analytics
- Total orders, revenue, top products, and orders by supplier.
- Estimated profit (where supplier cost prices are populated).

## 6. Inventory, Pricing & Availability Model

### 6.1 Supplier & Pricing Model
- **Phase One default: one supplier per item.** Each catalog item is a single customer-facing listing tied to a single supplier, with one sell price, one pricing unit, and one delivery timeline. Minimal data entry — start with whatever supplier info is available (even just name and number).
- **Data shaped for growth:** the underlying item structure is designed so it can later hold a *list* of supplier entries (each with its own cost, sell price, and delivery timeline) without restructuring the stored data. Only the admin UI is deferred.
- **When multi-supplier is enabled (later):** the admin marks one supplier entry as "active" per item, and the active entry's sell price + timeline are what the customer sees — so the customer experience stays clean (one price, one timeline, never a supplier picker). Automatic selection (cheapest / fastest) is a possible further enhancement.

### 6.2 Pricing Unit Display
- Prices are stored and displayed per selling unit (dozen, case, bulk pack), with the unit label set per item in the backend.
- The UI must present the unit clearly so customers always know what a price refers to.

### 6.3 Profit Tracking (Optional / Later)
- Cost price is an optional internal field. When present, profit per item = active sell price − active supplier cost.
- Can be left empty initially and backfilled; feeds into admin analytics when available.

### 6.4 Availability
- Customers see and order only from the curated standard catalog.
- Catalog grows over time as the admin confirms items with suppliers.
- Availability (in/out of stock) is manually set in the dashboard and reflected in the app, independent of any supplier-side system.

## 7. Localization (Arabic-Native)
- **Arabic is the default language; layout is RTL by default.** English is a secondary option the user can switch to (LTR).
- All UI strings are localized (Arabic + English) — no hardcoded text. Use iOS localization (`Localizable.strings`) and a `Locale`/language toggle in Account.
- Catalog content is bilingual: each product and category carries Arabic and English `name`/`description`. Arabic shown by default.
- RTL correctness: mirrored navigation, icons, steppers, the order status tracker, and the back button. Numbers and prices formatted appropriately (Arabic-Indic or Western digits — confirm preference).
- Map, OTP, and payment sheets must read correctly in RTL.

## 8. Empty States
Every screen that can be empty needs a deliberate state — never a blank screen — explaining why it's empty and offering one clear next action. Key ones:

- **Empty cart:** "Your cart is empty" + "Browse supplies" → Shop.
- **No orders yet (new customer):** "No orders yet — your first order will appear here" + "Start shopping" → Shop.
- **Search / category with no results:** "Nothing here yet" + suggestion to clear filters or browse all.
- **Location permission denied (checkout):** explain location is needed to set delivery, with a button to enable it in Settings or to place the pin manually.
- **Out of stock (product/variant):** clear "Out of stock" label; not addable; the rest of the screen stays usable.
- **No network / load failure:** state what happened and offer "Retry" (in the interface's voice, not an apology).

Copy is written for the end user, in Arabic first, in plain active voice.

## 9. Out of Scope for Phase One (Future Phases)
- Automated order routing to suppliers.
- Multi-supplier-per-item UI and "active supplier" selection (data model already supports it).
- Supplier-facing dashboard / driver "out for delivery" notifications.
- Supplier inventory syncing.
- Manual card entry / additional payment gateways (e.g. Stripe), saved cards.
- Saudi National Address (SPL) API verification of delivery addresses. *Note: the SPL National Address API exists, but its current terms, pricing, and onboarding need to be verified before committing.*
- Delivery coverage beyond Jeddah (additional cities).
- Custom (off-catalog) item requests.
- Android app.

## 10. Open Items to Confirm
- Finalize supplier list and contacts (in progress).
- Seed catalog item list (to be drafted by implementer for your review).
- Whether Apple Pay limits affect typical bulk order sizes.
- Source the list of Jeddah districts for the address selector / labels.
- Define the Jeddah geofence boundary (polygon or center + radius) for the coordinate check.
- Verify Saudi National Address (SPL) API terms before planning the Phase Two integration.
- Confirm number/price digit style for Arabic: **resolved — Western/English numerals (0–9)** throughout (prices, quantities, order numbers, OTP), pairing with the monospace ledger style and the modern look.
