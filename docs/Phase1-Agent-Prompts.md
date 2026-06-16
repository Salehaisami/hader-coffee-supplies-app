# Agent Prompts — Coffee Supplies App Phase One

Use these prompts to kick off each milestone in a fresh Kiro session. Each one is self-contained — just paste it in. They reference the planning docs in `~/Documents/Coffee-Supplies-App-Phase1/`.

---

## Milestone 1 — Data Layer & Models

```
Build Milestone 1 (Data Layer) of the Coffee Supplies App.

Source docs are in ~/Documents/Coffee-Supplies-App-Phase1/:
- Phase1-Architecture.md §2 (Firestore Data Model), §4 (Security Rules)
- Phase1-Seed-Catalog.md (catalog content + variant structure)
- Phase1-Resolved-Decisions.md (geofence, districts, cancelled status)

Tasks:

T1.1 — Firestore Data Models
- Create Swift models + Codable/Firestore serialization for: users, categories, products (base + variants array + suppliers array, hasVariants, activeSupplierIndex, madeToOrder), suppliers, orders (with snapshot line items including variantLabel)
- Include bilingual fields (name_ar/name_en, description_ar/description_en)
- Unit tests: variant arrays, supplier arrays, bilingual fields, order line-item snapshotting with variantLabel, using the Firestore fake from M0

T1.2 — Firestore Security Rules
- Write rules: public read for products/categories; users read/write own doc (admin all); orders create/read own (admin all, status field admin-only writable); suppliers admin-only
- Write rules unit tests (Firebase emulator) covering: customer, admin, unauthenticated, and NEGATIVE cases (customer cannot write order status, cannot read others' orders, cannot read suppliers)

T1.3 — Seed the Catalog
- Create a seed script/Cloud Function that loads categories and products into Firestore dev
- Use the catalog from Phase1-Seed-Catalog.md: cups/lids/straws with variants, printing items as madeToOrder, bilingual names, placeholder prices, single supplier each
- Include category-specific placeholder icon references for items without real images
- Verify: dev catalog is browsable and reflects the seed structure

Use the protocols and test infrastructure established in M0. All models should be Codable and work with the MockFirestoreService fake.
```

---

## Milestone 2 — Authentication & Account

```
Build Milestone 2 (Auth & Account) of the Coffee Supplies App.

Source docs are in ~/Documents/Coffee-Supplies-App-Phase1/:
- Phase1-Requirements.md §4.5 (Authentication), §5.4 (Customer Onboarding)
- Phase1-Architecture.md §3 (Authentication & Roles)
- Phase1-Wireframes.md §5 (Sign In/Sign Up), §10 (Account tab)

Tasks:

T2.1 — Phone OTP Auth
- Implement phone-OTP sign-in flow using Firebase Auth: phone entry → send code → verify, with resend timer (30s countdown)
- New number → profile setup screen (business name, contact name, optional email)
- onUserCreate Cloud Function sets status: pending, role: customer
- Returning user signs in and resumes prior screen (deep link back to checkout if that's where they came from)
- ViewModel unit tests covering the OTP state machine: entry → code → verify → resend timer → profile setup, against the MockAuthService
- XCUITest covering the happy-path sign-up flow

T2.2 — Account Tab
- Account screen: business details, saved delivery location entry point, order history link, help/contact, sign out, language toggle
- Guest version shows a sign-in prompt instead of details
- Both logged-in and guest states render correctly in RTL and LTR
- Sign out works and returns to guest state

Use the design tokens, components, and localization infrastructure from M0. Use the user model from M1.
```

---

## Milestone 3 — Catalog & Cart

```
Build Milestone 3 (Catalog & Cart) of the Coffee Supplies App.

Source docs are in ~/Documents/Coffee-Supplies-App-Phase1/:
- Phase1-Requirements.md §4.1 (Onboarding), §4.2 (Catalog), §4.3 (Product Detail), §4.4 (Cart)
- Phase1-Wireframes.md §1–4
- Phase1-Design-Language.md (product card, ledger-line, component patterns)
- Phase1-Resolved-Decisions.md §5 (Search: client-side filtering)

Tasks:

T3.1 — Onboarding Screens
- 2–3 swipeable, skippable onboarding screens shown once per install (UserDefaults flag)
- Content: (1) what the app is, (2) ordering is fast, (3) track deliveries
- Logged-in users skip entirely and land on Shop
- Skip and finish both land on Shop tab

T3.2 — Shop / Catalog + Categories
- Catalog home with category chips (horizontal scroll), product grid using ProductCard component
- "From" pricing for variant items (lowest variant price)
- Client-side search: filter on name_ar/name_en, min 2 chars, scoped to active category or all
- Guest browsing (no auth required), account icon shortcut
- Out-of-stock items show tag and aren't addable
- Empty/no-results states with "Clear search" action
- Fetches from Firestore with offline cache support

T3.3 — Product Detail + Variant Selector
- Detail screen: image, bilingual name/description, variant selector (only when hasVariants)
- Variant selection updates price, stock status, delivery estimate, and pricing unit live
- Made-to-order items show longer estimate + clear note
- Quantity stepper, sticky "Add to cart" button, cart badge increment
- Simple items: same screen, variant section absent
- Unit tests: detail ViewModel — variant selection → price/stock/delivery derivation, "from" pricing logic, madeToOrder handling

T3.4 — Cart
- Cart screen: line items (name + variant label, unit price, stepper, remove), subtotal, checkout CTA
- Empty cart state: "Your cart is empty" + "Browse supplies" → Shop
- Cart persists in app state across session (not across app kills for Phase 1 — simple @State/ObservableObject)
- Checkout routes to auth-if-guest, then checkout
- Unit tests: cart math — line totals, subtotal, quantity edits, removal, mixed variants (exhaustive)

Use M0 components and design tokens throughout. Use M1 models for products/categories.
```

---

## Milestone 4 — Location, Checkout & Orders

```
Build Milestone 4 (Checkout & Orders) of the Coffee Supplies App.

Source docs are in ~/Documents/Coffee-Supplies-App-Phase1/:
- Phase1-Requirements.md §4.6 (Checkout), §4.7 (Order Tracking)
- Phase1-Architecture.md §7 (Payments), §7a (Location & Delivery)
- Phase1-Wireframes.md §6–9
- Phase1-Resolved-Decisions.md §1 (Geofence: 55km, center 21.4858°N 39.1925°E), §2 (District list), §3 (Apple Pay reactive handling), §6 (Order cancellation)

Tasks:

T4.1 — Location Capture + Map Pin
- MapKit picker with draggable pin, location permission request
- Reverse-geocode to district (from the 34-district list + Other)
- Store raw lat/lng coordinates
- Permission-denied empty state with manual-pin fallback (user can still drag pin without auto-locate)
- Saved location pre-fills on return visits (from user document)

T4.2 — Jeddah Geofence
- Validate pinned coordinates against: center (21.4858, 39.1925), radius 55km
- If outside → disable "Place order" with inline message: "We currently deliver within Jeddah only"
- Unit tests: points inside, outside, and on boundary

T4.3 — Checkout + Payments
- Checkout screen: delivery details (pin + district dropdown + street/notes), saved-location pre-fill
- Payment selector: Apple Pay sheet, Cash on Delivery (cod_unpaid)
- Apple Pay failure → show error message + "Switch to Cash on Delivery" one-tap fallback
- On success: write order to Firestore with coordinates, snapshot line items, payment status
- Unit tests: order assembly (totals, snapshots, payment status mapping) against payment/Firestore fakes
- XCUITest: cash-on-delivery checkout flow end to end

T4.4 — Order Confirmation + History + Detail
- Confirmation screen after order placed
- Orders tab: active + past orders, status pills (pending, sent_to_supplier, delivered, cancelled)
- Order detail: 3-step tracker, items list, delivery address with Google Maps deep link, payment + total
- "Cancel order" button visible only when status is "pending" → sets status to "cancelled"
- No-orders empty state
- Unit tests: status→tracker-step mapping, Google Maps URL construction from lat/lng, cancellation state logic

Order status enum: pending | sent_to_supplier | delivered | cancelled
Google Maps link format: https://www.google.com/maps/search/?api=1&query=LAT,LNG
```

---

## Milestone 5 — Cloud Functions & Notifications

```
Build Milestone 5 (Cloud Functions & Notifications) of the Coffee Supplies App.

Source docs are in ~/Documents/Coffee-Supplies-App-Phase1/:
- Phase1-Architecture.md §5 (Cloud Functions)
- Phase1-Resolved-Decisions.md §4 (WhatsApp confirmation), §7 (Push on status change)

Tasks:

T5.1 — Order Notification to Admin
- onOrderCreate Cloud Function → notify admin via both push (FCM) and email
- Include order summary: order number, customer name, item count, total, payment method

T5.2 — Customer Order Confirmation (WhatsApp + Push)
- Extend onOrderCreate to send WhatsApp Business API template message to customer phone
- Template: "✓ Order #[number] received. [item count] items, total SAR [amount]. We'll update you when it ships."
- Fallback: if WhatsApp delivery fails, send SMS via Twilio
- Also send push notification (FCM) to customer device

T5.3 — Status Change Notifications to Customer
- onOrderUpdate Cloud Function: when status changes, notify customer via:
  - Push notification (FCM)
  - WhatsApp template message
- Messages:
  - sent_to_supplier: "Your order #[number] has been sent to our supplier."
  - delivered: "Your order #[number] has been delivered!"
- Skip notification for cancelled status (customer initiated it)

Dependencies: WhatsApp Business API account must be set up with approved templates before this milestone.
Cloud Functions are TypeScript/Node.js in the Firebase Functions directory.
```

---

## Milestone 6 — Admin Dashboard (Web)

```
Build Milestone 6 (Admin Dashboard) of the Coffee Supplies App.

Source docs are in ~/Documents/Coffee-Supplies-App-Phase1/:
- Phase1-Requirements.md §5 (Admin Dashboard — all subsections)
- Phase1-Architecture.md §1 (System Architecture), §3 (Auth)
- Phase1-Resolved-Decisions.md §10 (Admin auth: email/password)

This is a React/Next.js web app sharing the same Firebase project as the iOS app.
Use the same color tokens for brand consistency (Stone/Ink/Clay palette).

Tasks:

T6.1 — Admin Shell + Auth
- Next.js project with TypeScript
- Admin-only auth: email/password sign-in, Firebase custom claims (role: "admin")
- Non-admins blocked with clear message
- Layout/nav shell with sidebar: Orders, Catalog, Suppliers, Customers, Analytics

T6.2 — Order Management
- Incoming orders list with customer info, items, totals, Google Maps link
- Manual status updates: Pending → Sent to Supplier → Delivered
- Show cancelled orders (read-only, no action needed)
- Status changes propagate to customer app (via Firestore)

T6.3 — Catalog Management + Variants
- CRUD for products and categories
- Bilingual fields (Arabic + English) for names/descriptions/variant labels
- Price and pricing unit per item; per-variant price/stock for variant items
- Image upload to Firebase Storage
- Availability toggle (in stock / out of stock)
- madeToOrder flag for printing items
- Optional supplier cost price field

T6.4 — Supplier Management
- Simple CRUD: name, phone, email, handles-note
- Link suppliers to items

T6.5 — Customer Onboarding & Approval
- View new accounts (status: pending)
- Approve/suspend (background, non-blocking — ordering never blocked)
- Manual account creation option

T6.6 — Analytics
- Dashboard: total orders, revenue, top products, orders by supplier
- Estimated profit where cost prices exist (sell - cost)
- Unit tests for each metric calculation with fixture orders
```

---

## Milestone 7 — Hardening & Launch Prep

```
Build Milestone 7 (Hardening) of the Coffee Supplies App.

Source docs are in ~/Documents/Coffee-Supplies-App-Phase1/:
- Phase1-Requirements.md §7 (Localization), §8 (Empty States)
- Phase1-Design-Language.md (RTL notes)
- Phase1-Risks-and-Watchouts.md §C.1 (RTL correctness), §D (UX watchouts)

Tasks:

T7.1 — Empty States & Error/Offline Pass
- Verify every empty/error/offline state has directional Arabic-first copy + one action:
  - Empty cart, no orders yet, no search results, location denied, out of stock, load failure (retry), no network
- Each state must be reachable and correct in both RTL and LTR
- No blank screens anywhere in the app

T7.2 — RTL/Localization QA
- Screen-by-screen audit in Arabic/RTL and English/LTR
- Check: mirrored navigation, steppers, 3-step order tracker, back button
- Check: Western digits everywhere, no clipped/overflowing strings
- Check: mixed bidirectional text (Arabic labels with "12oz" or "SAR" inline)
- Check: map, OTP entry, and payment sheets read correctly in RTL

T7.3 — Accessibility & Polish
- VoiceOver labels on all interactive elements (Arabic-first)
- Focus order logical and complete
- Dynamic Type: verify at accessibility sizes (XXXL) — no truncation of critical info
- Reduced-motion: respect user preference, no essential animations
- Tap targets minimum 44×44pt
- Final spacing/type polish against the design reference (Phase1-Design-Language.html)

This milestone is QA and polish — no new features. Fix issues found during the audit.
```

---

## Usage Notes

- **Run sequentially:** M0 → M1 → M2 → M3 → M4 → M5, with M6 startable after M1, and M7 last.
- **Each prompt is self-contained.** Paste it into a fresh session. The agent will have access to the source docs.
- **Don't re-spec.** Tell the agent to skip requirements/design generation and go straight to implementation. The planning docs are the spec.
- **After each milestone:** verify it builds and tests pass before starting the next.
