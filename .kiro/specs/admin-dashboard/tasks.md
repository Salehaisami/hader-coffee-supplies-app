# Tasks — Admin Dashboard (M6)

## Task 1: Admin Shell + Auth
- [x] T6.1 Initialize Next.js project with TypeScript in ~/Documents/Coffee-Supplies-App-Phase1/HaderAdmin/
  - [x] T6.1.1 Create Next.js 14+ project with App Router, TypeScript, Tailwind CSS, and ESLint
  - [x] T6.1.2 Install and configure Firebase SDK (Auth, Firestore, Storage) with project ID hader-dcfcc
  - [x] T6.1.3 Implement email/password sign-in page with Firebase Auth
  - [x] T6.1.4 Add admin role check middleware — verify Firebase custom claims (role: "admin"), block non-admins with clear message
  - [x] T6.1.5 Build layout shell with sidebar navigation (Orders, Catalog, Suppliers, Customers, Analytics) using Stone/Ink/Clay color tokens

## Task 2: Order Management
- [x] T6.2 Build order management pages
  - [x] T6.2.1 Create orders list page with real-time Firestore listener showing customer info, items, totals, and Google Maps deep link
  - [x] T6.2.2 Build order detail view with line items, delivery address, payment info, and status
  - [x] T6.2.3 Implement manual status update buttons (Pending → Sent to Supplier → Delivered) with confirmation
  - [x] T6.2.4 Show cancelled orders as read-only with visual distinction
  depends on: T6.1

## Task 3: Catalog Management + Variants
- [x] T6.3 Build catalog management pages
  - [x] T6.3.1 Create categories CRUD page with bilingual name fields (Arabic + English) and sort order
  - [x] T6.3.2 Create products list page with filtering by category and search
  - [x] T6.3.3 Build product create/edit form with bilingual fields, pricing unit, delivery estimate, madeToOrder flag, and availability toggle
  - [x] T6.3.4 Implement variant array editor — add/edit/remove variants with per-variant price, stock, pricing unit, and bilingual labels
  - [x] T6.3.5 Add image upload to Firebase Storage with preview and URL storage on product document
  - [x] T6.3.6 Add optional supplier cost price field and supplier linking (single supplier per item in Phase One)
  depends on: T6.1

## Task 4: Supplier Management
- [x] T6.4 Build supplier management page
  - [x] T6.4.1 Create suppliers CRUD page with name, phone, email, and handles-note fields
  - [x] T6.4.2 Display supplier linkage info (which products reference this supplier)
  depends on: T6.1

## Task 5: Customer Onboarding & Approval
- [x] T6.5 Build customer management page
  - [x] T6.5.1 Create customers list page with status filtering (pending, approved, suspended)
  - [x] T6.5.2 Implement approve/suspend actions with confirmation (non-blocking — ordering never blocked)
  - [x] T6.5.3 Add manual account creation form (business name, contact name, phone, email, optional delivery address)
  depends on: T6.1

## Task 6: Analytics Dashboard
- [x] T6.6 Build analytics dashboard
  - [x] T6.6.1 Create analytics page with summary cards: total orders, total revenue, order count by status
  - [x] T6.6.2 Add top products section (by quantity sold and by revenue)
  - [x] T6.6.3 Add orders-by-supplier breakdown
  - [x] T6.6.4 Implement estimated profit calculation where cost prices exist (sell price − cost price)
  - [x] T6.6.5 Write unit tests for metric calculations with fixture order data
  depends on: T6.1
