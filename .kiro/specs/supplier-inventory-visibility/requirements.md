# Requirements Document

## Introduction

Give the admin visibility into what each supplier has in stock, and let them assign suppliers to order line items based on that information. Admin dashboard only — no iOS app changes, no Cloud Functions, no automated routing.

## Glossary

- **Supplier Inventory**: A Firestore subcollection tracking per-supplier, per-product stock quantities, maintained manually by the admin.
- **Stock Quantity**: The number of units of a product available at a specific supplier, as recorded by the admin. Supports decimals for weight/volume products.
- **Low-Stock Threshold**: A per-product-per-supplier number below which the admin dashboard shows a warning indicator.
- **Supplier Assignment**: The act of selecting which supplier fulfills a specific line item in an order.

## Requirements

### Requirement 1: Supplier Inventory Editing

**User Story:** As an admin, I want to record stock quantities per supplier per product in one place, so I know what's available when fulfilling orders.

#### Acceptance Criteria

1. The admin dashboard SHALL provide a supplier-centric inventory page listing all products with their stock quantities for that supplier.
2. The admin SHALL be able to set or update the stock quantity for any product at a given supplier.
3. The admin SHALL be able to set a low-stock threshold per product per supplier.
4. Each stock update SHALL record a lastUpdated timestamp.
5. The inventory page SHALL be accessible from the suppliers list via a link per supplier row.

### Requirement 2: Stock Visibility on Order Detail

**User Story:** As an admin reviewing an order, I want to see which suppliers have stock for each ordered item, so I can make informed fulfillment decisions.

#### Acceptance Criteria

1. The order detail page SHALL show, per line item, a summary of available stock across all suppliers that carry that product.
2. Each supplier's stock SHALL display with a status indicator: sufficient or insufficient for the ordered quantity.
3. The stock display SHALL be read-only on the order detail page.

### Requirement 3: Supplier Assignment Per Line Item

**User Story:** As an admin, I want to assign a supplier to each order line item based on stock availability, so fulfillment is clear and stock stays accurate.

#### Acceptance Criteria

1. The order detail page SHALL show a dropdown per line item allowing the admin to select a supplier for fulfillment.
2. The dropdown SHALL show each supplier's current stock for that product alongside the supplier name.
3. WHEN the admin selects a supplier and confirms, the system SHALL deduct the ordered quantity from that supplier's stock.
4. IF a deduction would result in negative stock, the system SHALL show a warning but allow the admin to proceed.
5. WHEN the admin changes the assigned supplier for a line item, the system SHALL restore stock to the previous supplier and deduct from the new one.

### Requirement 4: Low-Stock Indicators

**User Story:** As an admin, I want to see at a glance which supplier-product pairs are running low, so I can proactively coordinate restocking.

#### Acceptance Criteria

1. The supplier inventory page SHALL highlight rows where quantity is at or below the low-stock threshold.
2. The admin dashboard home page SHALL show a count of low-stock items linking to a filtered view.

### Requirement 5: Read-Only Stock on Product Page

**User Story:** As an admin editing a product, I want to see stock levels across suppliers without leaving the page, so I have context while making catalog decisions.

#### Acceptance Criteria

1. The product edit page SHALL display a read-only summary showing stock per supplier for that product.
2. Each supplier row SHALL link to the supplier inventory page for editing.
