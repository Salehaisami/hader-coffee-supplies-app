# Phase 1 Gaps & Phase 2/3 Planning

---

## Part 1: Phase 1 Gaps (Must Fix Before/During App Store Review)

### 🔴 App Store Blockers

| # | Issue | Risk | Notes |
|---|---|---|---|
| 1 | **No account deletion** | Rejection | Apple guideline 5.1.1(v) — any app that creates accounts must offer deletion. Need a "Delete my account" button + backend logic to purge user data. |
| 2 | **No privacy policy in-app** | Rejection | We have one hosted on GitHub Pages, but there's no link to it from within the app. Apple expects it accessible from the app itself. |
| 3 | **Dead menu items in Account** | Rejection risk | 4 menu items (Business Details, Delivery Location, Order History, Help) visibly exist but do nothing when tapped. Reviewers test every button. |
| 4 | **No privacy manifest (PrivacyInfo.xcprivacy)** | Rejection | Required for iOS 17+ apps. Declares what APIs you use and why (UserDefaults, location, etc.). |

### 🟡 Incomplete Features (UX Gaps)

| # | Issue | Impact |
|---|---|---|
| 5 | **No profile edit screen** | User can't update business name, contact name, or email after initial sign-up |
| 6 | **No delivery location editor** | Can't update saved delivery pin from the account menu (only during checkout) |
| 7 | **No help/contact screen** | No way for users to reach support |
| 8 | **Order History menu item** | Redundant with the Orders tab — should either navigate there or be removed |

### Summary of Work Needed

| Screen / Feature | Effort |
|---|---|
| Account Deletion flow (button + confirmation + Firestore/Auth cleanup) | Medium |
| Privacy Policy link in Account | Small |
| PrivacyInfo.xcprivacy manifest | Small |
| Business Details Edit screen | Small-Medium |
| Delivery Location Edit screen (reuse LocationPicker) | Small |
| Help/Contact screen (static content + email link) | Small |
| Wire Order History → Orders tab | Trivial |

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

**Now (before next TestFlight / App Store submission):**
1. Account deletion
2. Privacy manifest
3. Privacy policy link in-app
4. Wire up or remove dead menu items (Business Details edit, Location edit, Help, Order History)

**Phase 2 (post-launch, first 3-6 months):**
- Start with automated routing + WhatsApp confirmations (biggest ops relief)
- Then multi-city + Stripe (biggest growth enablers)

**Phase 3 (6-12 months):**
- Android + Supplier portal (platform scale)
- Everything else based on demand signals
