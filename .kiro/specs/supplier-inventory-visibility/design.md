# Technical Design: Supplier Inventory Visibility

## Overview

Admin-only feature. No iOS changes, no Cloud Functions. Firestore subcollection for stock data, three UI touchpoints in the admin dashboard.

## Data Model

### New: `suppliers/{supplierId}/inventory/{productId}`

```json
{
  "productId": "abc123",
  "quantity": 25.5,
  "lowStockThreshold": 5,
  "lastUpdated": "Timestamp"
}
```

- `quantity`: number (supports decimals for weight/volume)
- `lowStockThreshold`: number (0 = no threshold)
- `lastUpdated`: server timestamp on every write

### No changes to existing collections

- Orders keep existing `supplierId` field (now actively used per line item via UI)
- Products unchanged
- Suppliers unchanged

## Firestore Rules Addition

```
match /suppliers/{supplierId}/inventory/{productId} {
  allow read: if isAuthenticated();
  allow write: if isAdmin();
}
```

Also change existing suppliers rule from admin-only read to authenticated read:
```
match /suppliers/{supplierId} {
  allow read: if isAuthenticated();
  allow write: if isAdmin();
}
```

## Admin Dashboard Changes

### 1. Supplier Inventory Page (`/inventory/[supplierId]`)

- Route: `src/app/(dashboard)/inventory/[supplierId]/page.tsx`
- Shows: table of all products with columns: Product Name, Quantity, Threshold, Status, Last Updated, Actions (edit inline)
- Edit: click quantity cell → inline input → save
- Add: "Add Product" button → dropdown of products not yet in this supplier's inventory → set quantity
- Link from: suppliers table (new "Inventory" link per row)

### 2. Order Detail — Stock Info + Assignment

- Location: existing `src/app/(dashboard)/orders/[id]/page.tsx`
- Add below each line item row: expandable stock summary showing `Supplier A: 50 ✓ | Supplier B: 3 ⚠️`
- Add a "Assign Supplier" dropdown per line item
- On assignment: update order doc field + deduct from inventory subcollection
- On reassignment: restore old + deduct new (Firestore batch write)

### 3. Product Edit Page — Read-Only Stock

- Location: existing product form component
- Add a "Stock by Supplier" section (read-only)
- Shows: table with Supplier Name, Quantity, Threshold, Status
- Each row links to `/inventory/{supplierId}`

### 4. Dashboard Home — Low Stock Count

- Location: existing dashboard home page
- Add a 5th stat card: "Low Stock Items" with count
- Links to a filtered inventory view (or a simple page listing all low-stock pairs)

## Implementation Notes

- All queries are small (< 20 suppliers × < 200 products = < 4000 inventory docs max)
- No pagination needed
- Inline editing with optimistic UI + Firestore write
- Stock deduction uses `increment(-quantity)` for atomicity, but we allow negatives (admin override)
- No real-time listeners needed for inventory — `getDoc` on page load is sufficient (data changes infrequently)
