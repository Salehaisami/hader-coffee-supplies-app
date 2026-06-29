# Implementation Plan

## Overview

Implements supplier inventory visibility for the admin dashboard. Supplier-centric editing, read-only display on order detail and product pages, supplier assignment with stock deduction on orders. 8 tasks, ~3 days of work.

## Tasks

- [ ] 1. Update Firestore rules to add `suppliers/{supplierId}/inventory/{productId}` (authenticated read, admin write) and change `suppliers/{supplierId}` to authenticated read. Deploy via `firebase deploy --only firestore:rules`.
- [ ] 2. Create supplier inventory page at `src/app/(dashboard)/inventory/[supplierId]/page.tsx` — table of products with quantity, threshold, status indicator, inline editing, add/remove product, bilingual labels.
- [ ] 3. Add "Inventory" link to suppliers table row in `src/app/(dashboard)/suppliers/page.tsx` — navigates to `/inventory/{supplierId}`.
- [ ] 4. Add stock info display to order detail page — per line item, show stock across all suppliers with sufficient/insufficient indicators.
- [ ] 5. Add supplier assignment dropdown to order detail page — per line item, select supplier, deduct stock on assignment, restore on reassignment (batch write).
- [ ] 6. Add read-only stock summary to product edit page — show stock per supplier for the product, each row links to supplier inventory page.
- [ ] 7. Add low-stock count card to dashboard home page — count inventory docs where quantity is at or below threshold, link to filtered view.
- [ ] 8. Write seed script (`scripts/seed-inventory.js`) to populate sample inventory data for existing suppliers, run it, verify all pages render correctly.

## Task Dependency Graph

```json
{
  "waves": [
    [1],
    [2, 4, 6],
    [3, 5, 7, 8]
  ]
}
```

## Notes

- Tasks 2, 4, and 6 can be developed in parallel after Task 1 (they're independent UI surfaces reading the same data).
- Task 5 depends on Task 4 since the assignment dropdown sits alongside the stock display.
- No iOS changes, no Cloud Functions — admin dashboard only.
- Supplier count is small (< 20), product count < 200. No pagination needed.
