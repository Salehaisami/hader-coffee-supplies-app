# Admin Dashboard Requirements

Reference: Phase1-Requirements.md §5, Phase1-Architecture.md §1/§3, Phase1-Resolved-Decisions.md §10

## Overview
React/Next.js web app sharing the same Firebase project as the iOS app. Admin-only access via email/password with Firebase custom claims (role: "admin"). Uses Stone/Ink/Clay color palette for brand consistency.

## Functional Requirements

### FR-1: Admin Shell + Authentication
- Next.js project with TypeScript
- Email/password sign-in via Firebase Auth
- Firebase custom claims (role: "admin") gate access
- Non-admin users blocked with clear message
- Layout shell with sidebar navigation: Orders, Catalog, Suppliers, Customers, Analytics

### FR-2: Order Management
- View incoming orders with customer info, items, totals, Google Maps link
- Manual status updates: Pending → Sent to Supplier → Delivered
- Show cancelled orders (read-only)
- Status changes propagate to customer app via Firestore

### FR-3: Catalog Management
- CRUD for products and categories
- Bilingual fields (Arabic + English) for names/descriptions/variant labels
- Price and pricing unit per item; per-variant price/stock for variant items
- Image upload to Firebase Storage
- Availability toggle (in stock / out of stock)
- madeToOrder flag for printing items
- Optional supplier cost price field

### FR-4: Supplier Management
- Simple CRUD: name, phone, email, handles-note
- Link suppliers to items

### FR-5: Customer Onboarding & Approval
- View new accounts (status: pending)
- Approve/suspend (non-blocking — ordering never blocked)
- Manual account creation option

### FR-6: Analytics Dashboard
- Total orders, revenue, top products, orders by supplier
- Estimated profit where cost prices exist (sell - cost)
