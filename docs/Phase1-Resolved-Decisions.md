# Resolved Decisions & Gap Closures — Phase One

*Companion to Phase1-Risks-and-Watchouts.md. This document resolves the open blockers and gaps identified during implementation-readiness review.*

---

## 1. Jeddah Geofence — RESOLVED

**Decision: Center-point + radius approach.**

Jeddah extends approximately 70 km along its north-south axis. The urban area (including newer developments in the north like Obhur and the industrial zone in the south) spans roughly that full length. To generously include all of Jeddah plus a comfortable buffer for edge neighborhoods and GPS drift:

| Parameter | Value |
|---|---|
| Center | **21.4858° N, 39.1925° E** (approximate city centroid, near Al Balad) |
| Radius | **55 km** |

**Why 55 km:** The city stretches ~70 km north-south, so a 35 km radius from center would barely cover the extremes. A 55 km radius provides ~20 km of buffer beyond the urban edge in every direction. This ensures:
- Northern suburbs (Obhur, Dhahban area) are comfortably included
- Southern industrial districts are included
- GPS drift near boundaries won't reject legitimate customers
- It won't accidentally accept Mecca (~65 km east of center) — that's beyond the radius

**Implementation (T4.2):**
```swift
struct JeddahGeofence {
    static let center = CLLocationCoordinate2D(latitude: 21.4858, longitude: 39.1925)
    static let radiusMeters: CLLocationDistance = 55_000 // 55 km
    
    static func contains(_ coordinate: CLLocationCoordinate2D) -> Bool {
        let centerLocation = CLLocation(latitude: center.latitude, longitude: center.longitude)
        let pinLocation = CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude)
        return pinLocation.distance(from: centerLocation) <= radiusMeters
    }
}
```

**Future refinement:** If needed, replace the radius with a tighter polygon boundary. The center+radius is deliberately generous for Phase One — false positives (allowing a non-Jeddah customer) are less harmful than false negatives (rejecting a real Jeddah cafe).

---

## 2. Jeddah District List — RESOLVED

The following list covers the major districts where specialty cafes and commercial activity exist. Grouped loosely by area for readability, but the app presents them as a flat alphabetical dropdown (Arabic primary, English secondary).

**Implementation note:** Include an "Other / أخرى" option at the end so customers in unlisted or newly-developed districts aren't blocked.

| # | Arabic | English |
|---|---|---|
| 1 | الحمراء | Al Hamra |
| 2 | الروضة | Al Rawdah |
| 3 | الزهراء | Al Zahra |
| 4 | الشاطئ | Al Shati |
| 5 | السلامة | Al Salamah |
| 6 | المحمدية | Al Mohammadiyah |
| 7 | النزهة | Al Nuzha |
| 8 | النهضة | Al Nahdah |
| 9 | الأندلس | Al Andalus |
| 10 | الفيصلية | Al Faisaliyah |
| 11 | الربوة | Al Rabwah |
| 12 | المروة | Al Marwah |
| 13 | الصفا | Al Safa |
| 14 | البلد | Al Balad |
| 15 | الرحاب | Al Rehab |
| 16 | أبحر الشمالية | Obhur (North) |
| 17 | أبحر الجنوبية | Obhur (South) |
| 18 | الخالدية | Al Khalidiyah |
| 19 | البغدادية | Al Baghdadiyah |
| 20 | المنار | Al Manar |
| 21 | الروابي | Al Rawabi |
| 22 | الرويس | Al Ruwais |
| 23 | بني مالك | Bani Malik |
| 24 | السليمانية | Al Sulaymaniyyah |
| 25 | العزيزية | Al Aziziyyah |
| 26 | المرجان | Al Murjan |
| 27 | الشرفية | Al Sharafiyah |
| 28 | الورود | Al Wurud |
| 29 | الحمدانية | Al Hamdaniyah |
| 30 | الياقوت | Al Yaqout |
| 31 | طيبة | Taibah |
| 32 | الأمير فواز | Prince Fawaz |
| 33 | درة العروس | Durrat Al Arus |
| 34 | أخرى | Other |

**Note:** This list covers well-known districts where commercial activity and cafes are concentrated. It's not exhaustive of all 210+ administrative districts — that's what "Other" handles. The list can be expanded over time based on actual customer sign-ups.

---

## 3. Apple Pay Transaction Limits — RESOLVED

**Decision: Handle reactively at the client, not proactively as a blocker.**

**Key findings:**
- Apple does not impose a spending limit on in-app Apple Pay purchases. The limits are set by the issuing bank and/or payment processor.
- In-store (NFC contactless) limits exist in some regions, but in-app purchases (which is what this app uses) are generally unlimited from Apple's side.
- Saudi banks typically allow up to SAR 20,000 per transaction for digital payments; some banks may have lower limits depending on card type.

**Implementation (T4.3):**
- Attempt the Apple Pay transaction for the full order amount.
- If the payment fails (PKPaymentAuthorizationResult returns `.failure`), catch the error and display a clear message:
  - Arabic: "لم يتم إتمام الدفع عبر Apple Pay. يمكنك تقسيم الطلب أو الدفع عند الاستلام."
  - English: "Apple Pay payment could not be completed. You can split your order or pay cash on delivery."
- Offer "Switch to Cash on Delivery" as a one-tap fallback directly in the error state.
- No preemptive amount check or artificial cap needed.
- Log failed Apple Pay attempts (amount + error code) in analytics to monitor if limits become a pattern — this informs whether adding Stripe in a later phase is urgent.

**Why this works:** Most bulk cafe orders will be SAR 200–2,000 (a few hundred cups/lids). Orders exceeding SAR 5,000+ are rare at launch volume. Reactive handling avoids over-engineering while covering the edge case gracefully.

---

## 4. Customer Order Confirmation — RESOLVED: IN SCOPE

**Decision: Yes, send a WhatsApp message (not SMS) on order placement.**

**Rationale:**
- Customers signed up with their phone number — they expect communication there.
- WhatsApp is the dominant messaging platform in Saudi Arabia (95%+ penetration among the target demographic). It's also what the admin already uses for supplier routing.
- SMS has a per-message cost (~$0.05–0.10 to Saudi numbers) and requires Twilio/similar integration. WhatsApp Business API has a template-message model but is more natural for this audience.
- A simple order confirmation closes the trust loop: "We got your order, here's what you ordered, we'll update you."

**Implementation approach (T5.2 — no longer optional):**

**Phase One (MVP) — Cloud Function + WhatsApp Business API:**
- The `onOrderCreate` Cloud Function already notifies the admin. Extend it to also send a **WhatsApp Business API template message** to the customer's phone number.
- Template content (short, bilingual):
  - "✓ Order #[number] received. [item count] items, total SAR [amount]. We'll update you when it ships. — [App Name]"
- Use the WhatsApp Business API (via Meta's Cloud API or a provider like Twilio for WhatsApp). Template messages to opted-in users are low-cost.
- **Fallback:** If WhatsApp delivery fails (user not on WhatsApp, rare but possible), fall back to a simple SMS via Firebase Extensions or Twilio.

**Status update messages (stretch for Phase One):**
- Also send a WhatsApp message when order status changes to "Sent to Supplier" and "Delivered."
- These are simple template messages triggered by the same status-update Cloud Function.

**What this adds to the build:**
- T5.2 becomes non-optional. Scope: WhatsApp Business API integration in Cloud Functions, template message approval with Meta, fallback SMS path.
- Estimated additional effort: 1–2 tasks worth of work in M5.
- Dependency: WhatsApp Business API account setup (requires a verified business phone number and approved message templates — do this early, template approval can take 24–48h).

---

## 5. Search Behavior — RESOLVED

**Decision: Client-side filtering for Phase One.**

The catalog is small (~50–80 items). Full-text search infrastructure (Algolia, Elasticsearch) is overkill.

**Implementation:**
- Load all products into memory on catalog screen (they're already fetched for display).
- Filter on `name_ar` and `name_en` fields using case-insensitive substring matching.
- Search is scoped to the active category if one is selected, or all products if none.
- Minimum 2 characters before filtering activates (avoid single-letter noise).
- Show "No results" empty state with a "Clear search" action.

**Why this is right for Phase One:** Firestore doesn't support native full-text search. Adding a third-party search index for 50 items adds complexity, cost, and a sync problem. Client-side filtering is instant, works offline (if products are cached), and is trivially simple. Revisit when catalog exceeds ~500 items.

---

## 6. Order Cancellation — RESOLVED: IN SCOPE

**Decision: Allow cancellation while status is "Pending" (before admin routes it).**

**Implementation:**
- Order Detail screen shows a "Cancel order" button only when `status == "pending"`.
- Tapping it shows a confirmation prompt: "Cancel this order? This cannot be undone."
- On confirm: update order status to `cancelled` and set `updatedAt`.
- Cancelled orders appear in history with a "Cancelled" status pill (grey/muted).
- Admin dashboard shows cancelled orders (no action needed, just visibility).
- Once status moves to "Sent to Supplier" or beyond, cancellation is no longer available — the admin has already acted on it.

**Why this is right:** Low implementation cost (one status transition + a button conditional on state), high trust benefit. Customers who misorder or double-tap don't need to WhatsApp the admin to fix it.

**Addition to data model:** Add `cancelled` to the `status` enum for orders: `pending | sent_to_supplier | delivered | cancelled`.

---

## 7. Customer Push Notifications on Status Change — RESOLVED: IN SCOPE

**Decision: Push notification to customer when order status changes.**

**Implementation:**
- Extend the Cloud Function that handles order status updates (admin writes to Firestore).
- On status change → send a push notification (FCM) to the customer's device:
  - "Sent to Supplier": "Your order #[number] has been sent to our supplier."
  - "Delivered": "Your order #[number] has been delivered. Enjoy!"
- This pairs with the WhatsApp messages (decision #4). Push is the in-app channel; WhatsApp is the out-of-app channel.
- Requires: APNs setup in the iOS project, FCM token storage on the user document.

**What this adds:** A Cloud Function trigger on order document update (`onOrderUpdate`), plus FCM token management on the iOS side. Fits naturally into M5.

---

## 8. Image Placeholders — RESOLVED

**Decision: Use category-specific placeholder icons.**

**Implementation (T1.3 / T0.4):**
- Each category gets a simple, monochrome placeholder icon (line art style, matching the design language's minimal aesthetic).
- When a product's `imageUrl` is empty or fails to load, display the category placeholder.
- Icon set: cup icon (cups), lid icon (lids), straw (straws), napkin (napkins), bag (bags), box (food packaging), bean (consumables), printer (printing), utensil (cutlery), mop (cleaning).
- Use SF Symbols where available, or bundle a small set of custom SVGs.
- The product card component handles this gracefully — no broken image states ever visible.

---

## 9. Offline / Caching Strategy — RESOLVED

**Decision: Minimal caching for Phase One — catalog browsable on poor connectivity, orders require network.**

**Implementation:**
- **Firestore offline persistence:** Enable Firestore's built-in offline cache (it's opt-in on iOS). This means:
  - Products and categories are cached after first load.
  - Catalog browsing works on poor/no connectivity (shows last-fetched data).
  - Cart is client-side state (already works offline).
- **Orders require connectivity:** Placing an order, viewing order status, and checkout all require a network connection. Show the "No connection" error state with a "Retry" button if offline.
- **No background sync or conflict resolution** — not needed for Phase One's read-heavy customer experience.

**Why this is right:** Firestore's built-in persistence gives us 80% of the offline benefit with zero extra code. The catalog (which is what customers browse most) stays available. Transactional operations (ordering, payments) inherently need connectivity.

---

## 10. Admin Auth Method — RESOLVED

**Decision: Email/password for admin accounts.**

**Implementation (T6.1):**
- Admin users sign in to the web dashboard with email + password (Firebase Auth).
- Admin accounts are created manually (by you) in the Firebase console or via a Cloud Function — not self-service.
- Firebase custom claims (`role: "admin"`) gate access to the dashboard and Firestore admin-only rules.
- No phone OTP for admins — email/password is simpler for a web dashboard and doesn't require a phone.

---

## 11. VAT / Tax Handling — RESOLVED

**Decision: All prices are VAT-inclusive. No separate tax line.**

**Rationale:**
- Saudi Arabia charges 15% VAT. In B2B transactions between VAT-registered entities, the seller typically shows VAT-inclusive pricing.
- For Phase One (small operation, likely not yet VAT-registered at launch), prices shown are the prices charged. Period.
- No tax calculation, no tax line at checkout. The `sellPrice` field is what the customer pays.
- If/when the business becomes VAT-registered and needs to issue tax invoices, that's a Phase Two accounting concern — not an app UX change (the price displayed doesn't change; the backend just needs to generate compliant invoices).

**Add to catalog/requirements:** A note that all prices in the app are final (VAT-inclusive where applicable). No separate display needed.

---

## Summary: Updated Scope for Phase One

| Item | Status | Impact on Build Plan |
|---|---|---|
| Geofence (55 km radius) | ✅ Resolved | T4.2 can proceed as-is |
| District list (34 entries + Other) | ✅ Resolved | T4.1 has its data |
| Apple Pay limits | ✅ Reactive handling | T4.3 adds error state + COD fallback |
| Customer confirmation | ✅ In scope (WhatsApp + SMS fallback) | T5.2 is no longer optional; add WhatsApp Business API setup to M0 |
| Search | ✅ Client-side filtering | T3.2 implements inline |
| Order cancellation | ✅ In scope (Pending only) | Small addition to T4.4, add `cancelled` status |
| Push on status change | ✅ In scope | Add to M5, requires FCM/APNs setup in M0 |
| Image placeholders | ✅ Category icons | Part of T0.4 / T1.3 |
| Offline strategy | ✅ Firestore persistence | Enable in T0.1, no additional tasks |
| Admin auth | ✅ Email/password | T6.1 proceeds as-is |
| VAT | ✅ Prices are inclusive, no tax line | Documentation only, no build impact |

---

## Remaining Items That Still Need You (Not Buildable Without)

1. **Product imagery** — real photos for catalog items. Can use placeholders at launch but the premium feel depends on good imagery eventually. Start shooting/sourcing now.
2. **Supplier list & contacts** — still needed for the seed and for the WhatsApp routing to actually work. Even one or two suppliers is enough to start; the system handles one-per-item.
3. **WhatsApp Business API account** — needs a verified business phone number and Meta Business Manager setup. Template messages need approval (24–48h). Start this during M0.
4. **Apple Developer account + Apple Pay merchant setup** — standard but needs doing early so payment testing isn't blocked at M4.
