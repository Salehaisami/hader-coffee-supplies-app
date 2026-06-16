# Screen-by-Screen Wireframe Outline — iOS App (Phase One)

*Coffee shop supplies ordering app, Jeddah. This is a structural blueprint: what's on each screen, what the user does, and where it leads. Visual design (palette, type, polish) comes after this is approved. ASCII sketches are for layout intent only — not final proportions.*

---

## Navigation Model

Bottom tab bar (4 tabs), present after onboarding:

```
[ Shop ]   [ Cart ]   [ Orders ]   [ Account ]
```

- **Shop** — catalog (home).
- **Cart** — current cart (badge shows item count).
- **Orders** — order history + active order status.
- **Account** — profile, saved location, sign in/out.

Guests see all tabs; auth is only required at checkout.

---

## 1. Onboarding (first launch only)

2–3 swipeable screens, skippable. Shown once per install; logged-in users skip entirely.

```
┌───────────────────────────┐
│         [ illustration ]   │
│                            │
│   Bulk supplies for your   │
│   coffee shop — in a few   │
│   taps.                    │
│                            │
│   ● ○ ○            [Skip]   │
│        [ Next  → ]         │
└───────────────────────────┘
```

- Screen 1: what the app is. Screen 2: ordering is fast. Screen 3: track your deliveries.
- "Skip" and final "Get started" both land on **Shop**.

---

## 2. Shop / Catalog (home tab)

```
┌───────────────────────────┐
│  Supplies          [👤]    │  ← title + account shortcut
│  ┌─────────────────────┐   │
│  │ 🔍 Search supplies   │   │
│  └─────────────────────┘   │
│  [Cups][Lids][Straws][...] │  ← category chips (horizontal scroll)
│                            │
│  Cups                      │  ← section header
│  ┌───────┐  ┌───────┐      │
│  │ img   │  │ img   │      │  ← product cards (2-col grid)
│  │ Paper │  │ Cold  │      │
│  │ Cup   │  │ Cup   │      │
│  │ fr 48 │  │ fr 55 │      │  ← "from" price when variants
│  │ /dozen│  │ /1000 │      │
│  └───────┘  └───────┘      │
│  Lids                      │
│   ...                      │
└───────────────────────────┘
   [Shop] [Cart] [Orders] [Account]
```

- Product card (reusable component): image, name, price + unit. For variant items, show "from <lowest price>".
- Out-of-stock items show a subtle "Out of stock" badge and are not addable.
- Tapping a card → Product Detail. Tapping account icon → Account (or Sign In if guest).
- Tapping a category chip filters/jumps to that section.

---

## 3. Product Detail

```
┌───────────────────────────┐
│ ←                    [👤]  │
│      [   product image  ]  │
│                            │
│  Paper Cup (hot)           │
│  SAR 48 / dozen            │  ← updates with variant
│                            │
│  Size                      │  ← only if variants exist
│  [4oz][8oz][12oz✓][16oz]   │  ← variant selector
│                            │
│  Delivery: 2–4 days        │
│  In stock                  │
│                            │
│  Description text…         │
│                            │
│  Qty  [ − ] 3 [ + ]        │
│  ┌───────────────────────┐ │
│  │     Add to cart       │ │  ← sticky bottom
│  └───────────────────────┘ │
└───────────────────────────┘
```

- Variant selector updates price, delivery estimate, and stock state live.
- Made-to-order items (printing) show a longer delivery estimate + a clear note here.
- "Add to cart" confirms with a brief toast; cart badge increments.
- No selector renders for simple items — same screen, variant section just absent.

---

## 4. Cart

```
┌───────────────────────────┐
│  Cart                      │
│  ┌───────────────────────┐ │
│  │ [img] Paper Cup 12oz  │ │
│  │       SAR 48 / dozen  │ │
│  │       [−] 3 [+]   🗑   │ │
│  └───────────────────────┘ │
│  ┌───────────────────────┐ │
│  │ [img] Hot Lid 12/16oz │ │
│  │       [−] 2 [+]   🗑   │ │
│  └───────────────────────┘ │
│                            │
│  Subtotal        SAR 264   │
│  ┌───────────────────────┐ │
│  │      Checkout         │ │  ← sticky
│  └───────────────────────┘ │
└───────────────────────────┘
```

- Each line: image, name + variant label, unit price, quantity stepper, remove.
- Empty state: "Your cart is empty" + "Browse supplies" button → Shop.
- "Checkout" → if guest, Sign In first; else Checkout.

---

## 5. Sign In / Sign Up (Phone OTP)

Triggered at checkout (or from Account).

```
Step 1 — phone              Step 2 — code
┌───────────────────┐       ┌───────────────────┐
│  Sign in          │       │  Enter the code    │
│  We'll text a code│       │  Sent to +966…     │
│  +966 [ 5X XXX… ] │       │  [ _ _ _ _ ]       │
│  [   Continue   ] │       │  [   Verify     ]  │
│                   │       │  Resend in 0:30    │
└───────────────────┘       └───────────────────┘
```

- New numbers continue to a short **profile setup**: business name, contact name, email (optional).
- Returning users skip straight back to where they were (e.g. Checkout).
- New accounts can order immediately (status `pending` in the background).

---

## 6. Checkout

```
┌───────────────────────────┐
│ ←  Checkout                │
│  Delivery location         │
│  ┌───────────────────────┐ │
│  │   [ map w/ pin ]      │ │  ← MapKit, draggable pin
│  │        📍             │ │
│  └───────────────────────┘ │
│  Drag pin to your entrance │
│  District [ Al Rawdah  ▾ ] │
│  Street / building [____]  │
│  Notes [_______________]   │
│                            │
│  Payment                   │
│  ( ) Apple Pay             │
│  (•) Cash on delivery      │
│                            │
│  Subtotal        SAR 264   │
│  ┌───────────────────────┐ │
│  │    Place order        │ │
│  └───────────────────────┘ │
└───────────────────────────┘
```

- Auto-locates on open (with permission); pin draggable to exact entrance.
- **Jeddah geofence:** if pin is outside Jeddah, "Place order" is disabled with a clear inline message ("We currently deliver within Jeddah only").
- Saved location pre-fills on return visits (editable).
- District dropdown limited to Jeddah districts; street/notes free text.
- Apple Pay → native sheet. Cash on delivery → order placed as unpaid.

---

## 7. Order Confirmation

```
┌───────────────────────────┐
│        ✓ Order placed      │
│   Order #1042              │
│   We'll text you updates.  │
│   Status: Pending          │
│  ┌───────────────────────┐ │
│  │   View order          │ │
│  └───────────────────────┘ │
│      Back to shop          │
└───────────────────────────┘
```

- "View order" → Order Detail. "Back to shop" → Shop.

---

## 8. Orders (tab) — History + Status

```
┌───────────────────────────┐
│  Orders                    │
│  Active                    │
│  ┌───────────────────────┐ │
│  │ #1042  • Pending       │ │
│  │ 3 items · SAR 264      │ │
│  │ Placed today           │ │
│  └───────────────────────┘ │
│  Past                      │
│  ┌───────────────────────┐ │
│  │ #1038  • Delivered     │ │
│  │ 5 items · SAR 410      │ │
│  └───────────────────────┘ │
└───────────────────────────┘
```

- Status pill uses the three states: Pending → Sent to supplier → Delivered.
- Tap a row → Order Detail.

---

## 9. Order Detail

```
┌───────────────────────────┐
│ ←  Order #1042             │
│  Status: Pending           │
│  ──●───────○───────○──     │  ← simple 3-step tracker
│   Pending  Sent  Delivered │
│                            │
│  Items                     │
│  • Paper Cup 12oz ×3       │
│  • Hot Lid 12/16oz ×2      │
│                            │
│  Deliver to                │
│  Al Rawdah, <street>       │
│  [ View on map ]           │  ← Google Maps link
│                            │
│  Payment: Cash on delivery │
│  Total: SAR 264            │
└───────────────────────────┘
```

- 3-step tracker reflects current status (admin-updated).
- "View on map" opens Google Maps via the stored coordinates.

---

## 10. Account (tab)

```
┌───────────────────────────┐
│  Account                   │
│  <Business name>           │
│  +966 5X XXX XXXX          │
│                            │
│  Saved delivery location → │
│  Order history           → │
│  Help / contact          → │
│                            │
│  [ Sign out ]              │
└───────────────────────────┘
```

- Guest version shows a "Sign in" prompt instead of details.
- "Saved delivery location" → map editor to update the pin/address.

---

## Flow Summary

```
First launch → Onboarding → Shop
Shop → Product Detail → Add to cart → Cart → Checkout
   (guest at checkout → Sign In/Up → back to Checkout)
Checkout → Place order → Confirmation → Order Detail
Orders tab → Order Detail (status tracker)
Account tab → saved location / history / sign out
```

## Notes for Design Phase (next step)
- The product card and the variant selector are the two components to design first — they set the tone and are reused everywhere.
- Polish priorities for this market: fast, clean catalog; obvious pricing units; frictionless OTP; a confident, simple checkout.
- **Arabic-native, RTL by default** (decided): every screen above is designed Arabic-first and mirrored for RTL; English is a secondary LTR mode. Sketches above are shown LTR for readability but mirror in the real app.
- **Empty states are specified** (see Requirements §8): empty cart, no orders yet, no search results, location denied, out of stock, and load failure each get directional Arabic-first copy and one clear action — never a blank screen.
