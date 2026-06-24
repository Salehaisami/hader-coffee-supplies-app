# Phase 1 Gaps & Phase 2/3 Planning

---

## Part 1: Phase 1 Gaps — ✅ ALL RESOLVED

All App Store blockers and UX gaps have been addressed.

### 🔴 App Store Blockers — FIXED

| # | Issue | Resolution |
|---|---|---|
| 1 | **No account deletion** | ✅ `DeleteAccountView` — full flow with confirmation, Firestore cleanup, and Auth deletion |
| 2 | **No privacy policy in-app** | ✅ Accessible from Help screen in Account menu |
| 3 | **Dead menu items in Account** | ✅ All wired to real screens; Order History removed (redundant with tab) |
| 4 | **No privacy manifest** | ✅ `PrivacyInfo.xcprivacy` added declaring all API usage reasons |

### 🟡 UX Gaps — FIXED

| # | Issue | Resolution |
|---|---|---|
| 5 | **No profile edit screen** | ✅ `BusinessDetailsEditView` — edit name, contact, email + delivery location with mini-map |
| 6 | **No delivery location editor** | ✅ Merged into Business Details screen with `LocationPickerCoverView` + `MiniMapSnapshotView` |
| 7 | **No help/contact screen** | ✅ `HelpView` — support email link + privacy policy link + app version |
| 8 | **Order History menu item** | ✅ Removed (redundant with Orders tab) |

### Architecture Note: Location Picker in Modal Context

The location picker uses a `LocationPickerCoverView` wrapper that owns its `LocationPickerViewModel` as `@State`. This prevents SwiftUI's `.fullScreenCover` body re-evaluations from recreating the ViewModel (which would reset the user's pin coordinate). The mini-map uses `MKMapSnapshotter` instead of an interactive `Map` widget to avoid MapKit lifecycle issues in non-interactive contexts.

---

## Part 2: Phase 2 — Operational Scaling

*Focus: Remove manual bottlenecks, expand payment options, grow geography.*

| # | Feature | Description |
|---|---|---|
| 1 | **Automated supplier routing** | Cloud Function routes orders to the correct supplier automatically (WhatsApp Business API / email templates) instead of admin doing it manually |
| 2 | **Multi-supplier UI (admin)** | Admin can assign multiple suppliers per product and select the active one — data model already supports this |
| 3 | **Stripe / card payments** | Add manual card entry as a payment option alongside Apple Pay and COD |
| 4 | **Multi-city delivery** | Expand beyond Jeddah — configurable geofences per city, city selector in checkout |
| 5 | **WhatsApp order confirmations** | Auto-send order confirmation and status updates to customers via WhatsApp Business API (spec'd in Phase 1 resolved decisions but not built) |
| 6 | **Push notifications on status change** | FCM push to customer when order moves to "Sent to Supplier" or "Delivered" (spec'd but not built) |
| 7 | **Order re-ordering** | "Reorder" button on past orders — pre-fills cart with the same items |
| 8 | **Admin mobile optimization** | Full mobile-friendly admin dashboard (started but not complete) |

---

## Part 3: Phase 3 — Platform Expansion

*Focus: New platforms, supplier empowerment, advanced features.*

| # | Feature | Description |
|---|---|---|
| 1 | **Android app** | Native Android or cross-platform (Flutter/KMP) version of the customer app |
| 2 | **Supplier portal** | Web dashboard for suppliers to see incoming orders, confirm availability, update delivery status |
| 3 | **Supplier inventory syncing** | Real-time stock updates from supplier systems (or manual supplier input via portal) |
| 4 | **Driver tracking** | "Out for delivery" status with real-time driver location |
| 5 | **SPL National Address** | Saudi National Address API integration for verified delivery addresses |
| 6 | **Custom item requests** | Off-catalog requests where customers describe what they need |
| 7 | **Loyalty / repeat ordering** | Subscription-style repeat orders, volume discounts, or loyalty points |
| 8 | **Analytics v2** | Customer insights, demand forecasting, supplier performance scoring |
| 9 | **Multi-language expansion** | Additional languages beyond Arabic/English if expanding regionally |

---

## Recommended Execution Order

**Phase 1 gaps:** ✅ Complete — all items shipped.

**Phase 2 (post-launch, first 3-6 months):**
- Start with automated routing + WhatsApp confirmations (biggest ops relief)
- Then multi-city + Stripe (biggest growth enablers)

**Phase 3 (6-12 months):**
- Android + Supplier portal (platform scale)
- Everything else based on demand signals
