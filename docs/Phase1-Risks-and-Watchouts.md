# Gaps, Risks & Watch-Outs — Phase One

*An honest register of what's unresolved, what could bite during build, and what to keep an eye on as the business runs. Grouped by type. This is meant to be candid — better to surface these now than discover them late.*

---

## A. Open decisions (need a human before/with build)
These are known unknowns already flagged across the docs.

1. **Jeddah geofence boundary** — needs an actual definition (polygon or center+radius). A loose radius will accept nearby non-Jeddah areas; a tight one may reject legitimate edge districts. Source a real boundary.
2. **Jeddah district list** — for the address selector/labels. Needs sourcing.
3. **Supplier list & contacts** — still being established. Catalog seeding and routing depend on it.
4. **Customer order-confirmation messages** — in scope or not? If yes, SMS or email? (SMS fits phone-based accounts but has a per-message cost.)
5. **Apple Pay transaction limits** — verify they don't choke realistic bulk-order totals before relying on Apple Pay as the only card path.
6. **Product imagery** — every item (ideally every variant) needs a clean photo to hit the premium bar. Sourcing/shooting these is a real task and a schedule risk if left late.

## B. Business & operational risks
The app is the easy part; the manual operation behind it is where most real risk sits.

1. **Manual fulfillment doesn't scale.** Routing every order by WhatsApp/email and hand-updating statuses is fine at low volume but becomes the bottleneck quickly. Watch order volume; have a threshold in mind where Phase Two automation becomes urgent.
2. **No real-time stock truth.** Availability is set manually. If an item is marked in-stock but the supplier is out, the customer is disappointed after ordering. Decide how fast you'll reconcile stock and how you'll handle "ordered but unavailable."
3. **Cash on delivery exposure.** COD means unpaid orders, no-shows, and cash handling/reconciliation. Define what happens on a refused/failed COD delivery before launch.
4. **Single point of failure (you).** Manual ops centered on one operator means orders stall if that person is unavailable. Plan basic coverage.
5. **Pricing accuracy.** Prices are hand-maintained; a stale price means selling at a loss or overcharging. The cost-price field helps catch margin issues — use it.
6. **Supplier reliability & delivery promises.** Delivery estimates shown to customers are only as good as supplier behavior. Over-promising on timelines erodes trust fast.

## C. Technical risks & watch-outs
1. **RTL correctness is easy to get subtly wrong.** Mirrored layouts, the status tracker direction, mixed Arabic/Latin strings ("12oz" in an Arabic line), and number formatting all need deliberate QA — not just a locale flip. Budget real testing time (T7.2).
2. **SwiftUI UI testing has limits.** As noted in the build plan, view bodies aren't unit-testable; reliance is on view-model unit tests + snapshots + XCUITest. Don't let anyone chase brittle UI-internal assertions.
3. **Apple Pay + Saudi specifics.** Apple Pay setup, merchant configuration, and supported cards in KSA need validation early — payment integration is a classic source of late surprises.
4. **Geofence edge behavior.** Test points on/just outside the boundary; GPS drift indoors can misplace a legitimate Jeddah cafe just outside the zone. Consider a small tolerance and the manual-pin override.
5. **Firestore data model migrations.** The variant/supplier arrays are designed to avoid migrations, but any *unforeseen* schema change in production is painful. Keep models versioned and changes additive where possible.
6. **Security rules are security.** With a public-read catalog and customer-owned orders, the rules are the actual access boundary. They must be tested with negative cases (T1.2) — a permissive rule is a data leak.
7. **Cost & free-tier limits.** Firebase, push, and SMS (if used) have costs that scale with usage. Watch the free-tier ceilings as volume grows.
8. **No offline strategy defined.** Behavior on poor connectivity (common on mobile) is only covered as error states. Decide whether any caching/offline cart resilience is needed.

## D. Product/UX watch-outs
1. **Empty states and error copy** are where polish silently slips. They're specified (Requirements §8) — make sure they're actually implemented, not stubbed.
2. **Onboarding friction vs. context.** Guest browsing is good, but make sure first-time users understand they're seeing real, orderable products and what the app is for.
3. **Variant clarity.** "From 48 / dozen" must never mislead — the price shown after selecting a size must be unmistakable, especially with bulk units.
4. **Made-to-order (printing) expectations.** These have longer lead times; the longer estimate + note must be prominent so customers aren't surprised.
5. **Accessibility.** Specified (T7.3) but easy to drop under time pressure. VoiceOver in Arabic deserves a real check.

## E. Legal / compliance (not yet addressed — flag for owner)
*These are outside what's been planned and worth a deliberate look; not legal advice.*
1. **Payment/business registration in KSA** — you mentioned gateways may need government registration. Confirm what's required to take payments commercially, even via Apple Pay.
2. **Privacy / PDPL.** Saudi Arabia's Personal Data Protection Law applies to collecting personal data (names, phones, location). A privacy policy and compliant handling/consent are likely needed before launch.
3. **App Store requirements.** Apple requires a privacy policy, accurate data-use disclosures, and a working account-deletion path — plan for these.
4. **Location data handling.** Capturing precise coordinates raises consent/storage obligations; align with the permission prompts and policy.
5. **Terms of service / delivery terms** — especially around COD, cancellations, and delivery promises.

## F. Things explicitly out of scope (so they're not mistaken for gaps)
Deferred by design, not overlooked: automated routing, supplier dashboard, driver notifications, multi-supplier UI, inventory sync, extra payment gateways, custom item requests, Android, non-Jeddah delivery, SPL address verification. See the brief and requirements for the full deferred list.

---

## How to use this doc
Review section A before build kicks off — those block or shape tasks. Sections B and E are business/owner responsibilities that the app can't solve on its own and shouldn't be assumed away. Sections C and D are for the build agent and QA to keep in view throughout, and several map directly to Milestone 7 hardening tasks.
