# Phase One Build Plan — Per-Agent Task Breakdown (for Kiro)

*A sequenced backlog of small, self-contained tasks for a Claude agent in Kiro. Each task lists its dependencies, the spec it implements, what to build, and acceptance criteria. Build top to bottom; tasks within the same milestone can often run in parallel unless a dependency is noted.*

**Source-of-truth specs (read before any task):**
- `Phase1-Requirements.md` — features, flows, localization, empty states, scope
- `Phase1-Architecture.md` — Firebase data models, security rules, functions, location/payments
- `Phase1-Seed-Catalog.md` — catalog content + variant structure
- `Phase1-Wireframes.md` — all 10 screens
- `Phase1-Design-Language.md` + `Phase1-Design-Language.html` — color tokens, type, components, ledger-line signature

**Global conventions (apply to every task):**
- iOS native, Swift / SwiftUI. Firebase backend (Firestore, Auth, Storage, Cloud Functions).
- Arabic-native, **RTL by default**, English secondary (LTR). All strings localized — no hardcoded text.
- **Western/English numerals (0–9)** everywhere.
- Fonts: Fraunces (display), IBM Plex Sans Arabic (body), IBM Plex Mono (prices/codes). SIL OFL.
- Use the color tokens and the ledger-line price pattern from the design language exactly.
- No browser storage. Quality floor: keyboard/VoiceOver focus, reduced-motion respected, responsive.

**Engineering standards (non-negotiable, apply to every task):**
- **Test-heavy by default.** Use **Swift Testing** (`@Test` / `#expect`, Apple's modern framework) for unit tests; **XCUITest** for end-to-end UI flows; snapshot tests for visual components. No task is "done" without tests (see per-task criteria). Aim for high, *meaningful* coverage of logic — not coverage theatre.
- **Architecture for testability and human readability.** Use MVVM: keep SwiftUI views thin and declarative; put all logic in observable view models and plain Swift types that are unit-testable in isolation. Inject dependencies (Firebase, location, payments) behind protocols so they can be mocked — never call SDKs directly from views or view models.
  - *Honest note on "UI unit testing":* SwiftUI view bodies are not meaningfully unit-testable. The robust, modern approach is (a) exhaustive **unit tests on view models / state logic**, (b) **snapshot tests** for component appearance incl. RTL + Dynamic Type, and (c) **XCUITest** for user flows. Do not write brittle tests that assert on view internals.
- **Clean, idiomatic, human-feeling code.** Small focused types and functions; clear intent-revealing names; standard Swift conventions (value types, `async/await`, `Result`, structured concurrency). Avoid over-engineering, needless abstraction, and over-commenting — comment *why*, not *what*. Code should read like a competent human engineer wrote it: simple first, patterns only when they earn their place.
- **Best practices:** no force-unwraps in app code; handle all error/loading states; no hardcoded secrets; keep functions short; prefer composition over inheritance; follow Apple HIG.
- **Each task delivers:** implementation + its tests + a brief PR-style summary of what changed and how it was verified. Mocks/fakes for external dependencies live in a shared test-support target.

---

## Milestone 0 — Foundations

### T0.1 — Project & Firebase setup
- **Deps:** none
- **Spec:** Architecture §1
- **Build:** Create the Xcode project (SwiftUI), add the Firebase SDK (Firestore, Auth, Storage, Functions), wire configuration, and stand up a Firebase project with empty Firestore + Storage. Set up environments (dev/prod) if practical.
- **Done when:** app launches, connects to Firebase, and a trivial Firestore read/write round-trips in dev.

### T0.2 — Design tokens & typography
- **Deps:** T0.1
- **Spec:** Design-Language.md (+ .html reference)
- **Build:** Encode color tokens (Stone 50/100/200/400, Ink, Ink Soft, Clay, Clay Deep, Sage) as a SwiftUI color system. Bundle the three fonts and define text styles for display/heading/body/mono roles. Set corner radii and spacing scale.
- **Done when:** a sample screen renders all tokens, the three type roles, and matches the reference.

### T0.3 — Localization & RTL scaffolding
- **Deps:** T0.1
- **Spec:** Requirements §7
- **Build:** Set up `Localizable.strings` (ar default + en), a language toggle hook, RTL layout enforcement, and a number formatter pinned to Western digits. Provide a helper for bilingual catalog fields (`*_ar`/`*_en`).
- **Done when:** app launches in Arabic/RTL by default; toggling to English flips to LTR; numbers always render 0–9.

### T0.4 — Reusable UI components
- **Deps:** T0.2, T0.3, T0.5
- **Spec:** Design-Language.md "Component Patterns"; Wireframes
- **Build:** Build shared components: product card (with ledger-line price + "from" variant pricing), category chip, primary/secondary buttons, quantity stepper, in-stock tag (Sage), status pill, and the empty-state component (icon + message + single action).
- **Done when:** each component renders in both RTL/LTR and is driven by sample data; matches the reference card. **Snapshot tests** cover each component in RTL + LTR and at a large Dynamic Type size.

### T0.5 — Test infrastructure & CI
- **Deps:** T0.1
- **Spec:** Engineering standards (above)
- **Build:** Set up the **Swift Testing** unit test target, **XCUITest** UI test target, and a snapshot-testing setup. Create a shared **test-support target** with protocol-based fakes/mocks for Firestore, Auth, Location, and Payments. Wire a CI workflow that runs all tests on each change and reports coverage.
- **Done when:** a sample view-model unit test, a sample snapshot test (incl. an RTL variant), and a sample XCUITest all run green in CI; mocks are injectable.

---

## Milestone 1 — Data Layer & Models

### T1.1 — Firestore data models
- **Deps:** T0.1
- **Spec:** Architecture §2
- **Build:** Swift models + Firestore (de)serialization for `users`, `categories`, `products` (base + `variants` + `suppliers` arrays, `activeSupplierIndex`, `madeToOrder`, `hasVariants`), `suppliers`, `orders` (with snapshot line items incl. `variantLabel`). Bilingual fields included.
- **Done when:** each model reads/writes to Firestore losslessly; **unit tests** cover variant arrays, supplier arrays, bilingual fields, and order line-item snapshotting (incl. `variantLabel`), using the Firestore fake.

### T1.2 — Security rules
- **Deps:** T1.1
- **Spec:** Architecture §4
- **Build:** Firestore rules — public read for products/categories; users read/write own doc (admin all); orders create/read own (admin all; status admin-only writable); suppliers admin-only.
- **Done when:** **rules unit tests** (Firebase emulator) pass for customer, admin, and unauthenticated cases, including negative cases (customer cannot write order status, cannot read others' orders, cannot read suppliers).

### T1.3 — Seed the catalog
- **Deps:** T1.1
- **Spec:** Seed-Catalog.md
- **Build:** A seed script/import that loads categories and products (with variants for cups/lids/straws, bilingual names, placeholder prices, single supplier each, `madeToOrder` on printing items) into Firestore dev.
- **Done when:** dev catalog is browsable and reflects the seed list structure.

---

## Milestone 2 — Authentication & Account

### T2.1 — Phone OTP auth
- **Deps:** T1.1, T1.2
- **Spec:** Requirements §4.5; Architecture §3
- **Build:** Phone-OTP sign-in (Firebase Auth) — phone entry → code → verify, with resend timer. New number → profile setup (business name, contact name, optional email). `onUserCreate` sets `status: pending`, `role: customer`.
- **Done when:** a new user can sign up via OTP and order immediately; returning user signs in and resumes prior screen. **View-model unit tests** cover the OTP state machine (entry → code → verify → resend timer → profile setup) against an auth fake; an **XCUITest** covers the happy-path sign-up flow.

### T2.2 — Account tab
- **Deps:** T2.1, T0.4
- **Spec:** Wireframes §10
- **Build:** Account screen — business details, saved delivery location entry point, order history link, help/contact, sign out, language toggle. Guest version shows a sign-in prompt.
- **Done when:** logged-in and guest states both render; sign out works.

---

## Milestone 3 — Catalog & Cart (Customer)

### T3.1 — Onboarding screens
- **Deps:** T0.4
- **Spec:** Requirements §4.1; Wireframes §1
- **Build:** 2–3 swipeable, skippable onboarding screens, shown once per install; logged-in users skip.
- **Done when:** appears only on first launch; skip and finish both land on Shop.

### T3.2 — Shop / catalog + categories
- **Deps:** T1.3, T0.4
- **Spec:** Requirements §4.2; Wireframes §2
- **Build:** Catalog home — category chips, product grid using the card component, "from" pricing for variant items, search, guest browsing, account shortcut. Empty/no-results states.
- **Done when:** guest can browse all categories; out-of-stock items show the tag and aren't addable.

### T3.3 — Product detail + variant selector
- **Deps:** T3.2
- **Spec:** Requirements §4.3; Wireframes §3
- **Build:** Detail screen — image, bilingual name/description, variant selector (only when `hasVariants`) that updates price/stock/delivery live, quantity stepper, made-to-order note, sticky add-to-cart.
- **Done when:** variant changes update price/availability; simple items show no selector; add-to-cart updates the cart badge. **Unit tests** cover the detail view model: variant selection → price/stock/delivery derivation, "from" pricing, and made-to-order handling.

### T3.4 — Cart
- **Deps:** T3.3
- **Spec:** Requirements §4.4; Wireframes §4
- **Build:** Cart screen — line items (name + variant label, unit price, stepper, remove), subtotal, checkout CTA, empty state. Cart persists in app state across the session.
- **Done when:** quantities/removal update totals; empty cart shows directional state; checkout routes to auth-if-guest then checkout. **Unit tests** cover cart math (line totals, subtotal, quantity edits, removal, mixed variants) exhaustively.

---

## Milestone 4 — Location, Checkout & Orders

### T4.1 — Location capture + map pin
- **Deps:** T0.4
- **Spec:** Requirements §4.6; Architecture §7a
- **Build:** MapKit picker with draggable pin, location permission request, reverse-geocode to district, store **raw lat/lng**. Permission-denied empty state with manual-pin fallback.
- **Done when:** pin coordinates persist; denied-permission path still allows manual placement.

### T4.2 — Jeddah geofence
- **Deps:** T4.1
- **Spec:** Requirements §4.6; Architecture §7a
- **Build:** Validate pinned coordinates against the Jeddah boundary (polygon or center+radius — see open item). Block checkout out-of-zone with a clear inline message.
- **Done when:** in-Jeddah pins pass; out-of-zone pins disable "Place order" with the message. **Unit tests** cover the geofence check with points inside, outside, and on the boundary.

### T4.3 — Checkout + payments
- **Deps:** T3.4, T4.2, T2.1
- **Spec:** Requirements §4.6; Architecture §7
- **Build:** Checkout — delivery details (pin + district + street/notes, saved-location pre-fill), payment selector (Apple Pay sheet; Cash on Delivery → `cod_unpaid`). On success write order to Firestore.
- **Done when:** both payment paths create a correct order with coordinates and snapshot line items. **Unit tests** cover order assembly (totals, snapshots, payment status mapping) against payment/Firestore fakes; an **XCUITest** covers the cash-on-delivery checkout flow end to end.

### T4.4 — Order confirmation + history + detail
- **Deps:** T4.3
- **Spec:** Requirements §4.7; Wireframes §7–9
- **Build:** Confirmation screen; Orders tab (active + past, status pills); Order detail with 3-step tracker (Pending → Sent to supplier → Delivered), items, delivery address with **Google Maps deep link**, payment + total. No-orders empty state.
- **Done when:** a placed order appears in history; detail shows correct status and opens Google Maps from coordinates. **Unit tests** cover status→tracker-step mapping and Google Maps URL construction from lat/lng.

---

## Milestone 5 — Cloud Functions & Notifications

### T5.1 — Order notification function
- **Deps:** T4.3
- **Spec:** Architecture §5
- **Build:** `onOrderCreate` Cloud Function → notify admin via **both push and email** with order summary.
- **Done when:** placing an order triggers both notifications in dev.

### T5.2 — (Optional) customer order confirmation
- **Deps:** T4.3
- **Spec:** Requirements open items
- **Build:** Optional SMS/email confirmation to the customer on order placement (decision pending).
- **Done when:** if enabled, customer receives a confirmation; cleanly off if disabled.

---

## Milestone 6 — Admin Dashboard (Web)

### T6.1 — Admin shell + auth
- **Deps:** T1.2
- **Spec:** Requirements §5; Architecture §1, §3
- **Build:** React/Next.js web app, admin-only auth (custom claims), layout/nav. Reuses color tokens for brand consistency.
- **Done when:** only admins can sign in; non-admins are blocked.

### T6.2 — Order management
- **Deps:** T6.1, T4.4
- **Spec:** Requirements §5.1
- **Build:** Incoming orders list + detail (customer info, items, Google Maps link), manual status updates (Pending / Sent to supplier / Delivered).
- **Done when:** status changes propagate to the customer app.

### T6.3 — Catalog management + variants
- **Deps:** T6.1, T1.3
- **Spec:** Requirements §5.2
- **Build:** CRUD for products/categories — bilingual fields, prices, pricing unit, per-variant price/stock, image upload to Storage, availability toggle, `madeToOrder`.
- **Done when:** edits appear live in the app; variant items editable per size.

### T6.4 — Supplier management
- **Deps:** T6.1
- **Spec:** Requirements §5.3
- **Build:** Simple supplier CRUD — name, phone, email, handles-note.
- **Done when:** suppliers can be created/edited and linked to items.

### T6.5 — Customer onboarding & approval
- **Deps:** T6.1, T2.1
- **Spec:** Requirements §5.4
- **Build:** View new accounts, background approve/suspend (non-blocking), manual account creation.
- **Done when:** admin can review/approve; ordering is never blocked by pending status.

### T6.6 — Analytics
- **Deps:** T6.2
- **Spec:** Requirements §5.5
- **Build:** Dashboard — total orders, revenue, top products, orders by supplier, estimated profit where cost prices exist.
- **Done when:** metrics compute correctly against seeded/test orders. **Unit tests** cover each metric calculation (revenue, top products, orders by supplier, estimated profit) with fixture orders.

---

## Milestone 7 — Hardening & Launch Prep

### T7.1 — Empty states & error/offline pass
- **Deps:** M3–M4
- **Spec:** Requirements §8
- **Build:** Ensure every empty/error/offline state has directional Arabic-first copy + one action: empty cart, no orders, no search results, location denied, out of stock, load failure (retry).
- **Done when:** each state is reachable and correct in RTL and LTR.

### T7.2 — RTL/localization QA
- **Deps:** all UI
- **Spec:** Requirements §7; Design-Language RTL notes
- **Build:** Audit every screen in Arabic/RTL and English/LTR — mirrored nav/steppers/tracker, Western digits, no clipped/overflowing strings.
- **Done when:** both languages pass a full screen-by-screen review.

### T7.3 — Accessibility & polish
- **Deps:** all UI
- **Spec:** Design-Language; global conventions
- **Build:** VoiceOver labels, focus order, Dynamic Type sanity, reduced-motion, tap targets. Final spacing/type polish against the reference.
- **Done when:** a full accessibility pass succeeds and screens match the design reference.

---

## Open items the build must not invent (confirm with product owner)
- Jeddah geofence boundary definition (polygon vs center+radius) and the district list (T4.1/T4.2).
- Whether customer order-confirmation messages are in scope (T5.2).
- Finalized supplier list/contacts (seed + T6.4).
- Apple Pay transaction-limit impact for large bulk orders (T4.3).

## Suggested build order
M0 → M1 → M2 → M3 → M4 → M5, with M6 (admin) startable in parallel after M1, and M7 last. Earliest end-to-end demo: T0.* + T1.1/T1.3 + T2.1 + T3.2/T3.3/T3.4 + T4.1–T4.4.
