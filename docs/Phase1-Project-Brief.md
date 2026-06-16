# Project Brief — Coffee Shop Supplies Ordering App (Phase One)

*A B2B mobile app for ordering coffee-shop supplies in bulk, serving independent specialty cafes in Jeddah. This brief stitches together the full Phase One planning set for handoff. Each section links to the detailed source doc.*

---

## 1. What we're building (in one paragraph)
An iOS app where coffee shop managers and owners in Jeddah browse a curated catalog of supplies (cups, lids, straws, sleeves, napkins, consumables, light food packaging, printing) and place bulk orders in a few taps, paying by Apple Pay or cash on delivery and tracking delivery status. Fulfillment is **manual**: the operator receives each order, routes it to a supplier via WhatsApp/email, and updates status by hand. A web admin dashboard manages the catalog, orders, suppliers, and analytics. The app is **Arabic-native (RTL by default)** and design-led, aimed at a taste-conscious specialty-cafe audience.

## 2. Who it's for
- **Customers:** managers/owners of independent specialty ("third-wave") coffee shops in Jeddah.
- **Operator/Admin:** you and your team, fulfilling orders manually and managing the catalog.
- Geographic scope at launch: **Jeddah only**, enforced by a map geofence.

## 3. Scope at a glance
**In scope (Phase One):**
- Onboarding, guest catalog browsing, categories, search
- Product detail with size/option **variants** (cups, lids, straws)
- Cart, phone-OTP auth at checkout, Apple Pay + cash on delivery
- Map-pin delivery location with Jeddah geofence; Google Maps links for drivers
- Order tracking (Pending → Sent to supplier → Delivered) and order history
- Admin dashboard: orders, catalog + variants, suppliers, customer approval, analytics
- Arabic-native/RTL, empty states, manual fulfillment

**Deliberately deferred (later phases):**
- Automated supplier routing; supplier-facing dashboard; driver "out for delivery" notifications
- Multi-supplier-per-item UI (data model already supports it)
- Inventory syncing; additional payment gateways (Stripe), saved cards, manual card entry
- Custom (off-catalog) item requests; Android; delivery beyond Jeddah; SPL National Address verification

## 4. Key product decisions (and why)
- **Curated catalog only** — customers order from a vetted standard list; the operator grows it over time. Keeps quality and ops manageable.
- **One supplier per item at launch, data shaped for many** — minimal data entry now, no migration later.
- **Variants as one product with a selector** (Shopify-style) for cups/lids/straws — cleaner catalog, familiar UX; a shared base schema with an optional `variants` array.
- **Immediate checkout** — new accounts can order right away (status `pending` for background review), to avoid friction.
- **Manual, simple order statuses** — three states, realistic for a hand-run operation.
- **Jeddah-only via geofence on real coordinates** — not just a dropdown.
- **Map-agnostic coordinates + Google Maps links** — capture with MapKit, navigate with Google Maps (common in Saudi).

## 5. Tech stack
- **iOS:** native Swift / SwiftUI, MVVM, dependencies behind protocols for testability.
- **Backend:** Firebase — Firestore, Auth (phone OTP), Storage, Cloud Functions.
- **Admin:** React/Next.js web app.
- **Payments:** Apple Pay + Cash on Delivery.
- **Testing:** Swift Testing (unit), XCUITest (flows), snapshot tests (components); CI runs all.

## 6. Design language (the feel)
Calm, editorial, premium-minimal: warm **stone** neutrals (not cream), **espresso ink** text, a single restrained **clay** accent, rare **sage** for positive signals. Editorial serif (Fraunces) for headings, IBM Plex Sans Arabic for body, IBM Plex Mono for the **"ledger-line"** prices — the signature element. Western numerals throughout. All fonts are open-source (SIL OFL), so no licensing cost. The identity is intentionally **hospitality-broad** — it would extend to hotels/restaurants without a redesign, should scope widen later.

## 7. The document set
| Doc | What it covers |
|---|---|
| `Phase1-Requirements.md` | Features, customer + admin flows, localization, empty states, scope |
| `Phase1-Architecture.md` | Firestore data models, security rules, Cloud Functions, location & payments |
| `Phase1-Seed-Catalog.md` | Coffee-shop catalog content + variant structure |
| `Phase1-Wireframes.md` | All 10 screens — structure and flow |
| `Phase1-Design-Language.md` + `.html` | Visual identity spec + live, viewable reference |
| `Phase1-Build-Plan.md` | Test-first, per-agent task breakdown for Kiro |
| `Phase1-Risks-and-Watchouts.md` | Open gaps, risks, and things to watch during build |

## 8. How to start building
Follow the build plan order: **M0 foundations → M1 data → M2 auth → M3 catalog & cart → M4 location/checkout/orders → M5 functions**, with **M6 admin** in parallel after M1 and **M7 hardening** last. Earliest end-to-end demo is achievable after the M0 setup plus the core catalog→cart→checkout→order path. Every task carries its own tests and a short change summary.

## 9. What still needs a human decision before/with build
See `Phase1-Risks-and-Watchouts.md` for the full list. The headline items: define the **Jeddah geofence boundary** and district list, finalize the **supplier list/contacts**, confirm whether **customer confirmation messages** are in scope, and validate **Apple Pay limits** against typical bulk-order sizes.
