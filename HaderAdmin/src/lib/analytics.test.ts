import { describe, it, expect } from "vitest";
import {
  computeOrderMetrics,
  computeTopProducts,
  computeOrdersBySupplier,
  computeEstimatedProfit,
} from "./analytics";
import { type Order, type Supplier } from "./types";

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

/** Minimal order factory for testing. Only the fields used by analytics. */
function makeOrder(overrides: Partial<Order> & { items: Order["items"]; total: number; status: Order["status"] }): Order {
  return {
    id: "order-" + Math.random().toString(36).slice(2, 8),
    customerId: "cust-1",
    businessName: "Test Business",
    deliveryAddress: { city: "Riyadh", district: "Olaya", lat: 24.7, lng: 46.7 },
    subtotal: overrides.total,
    paymentMethod: "cash_on_delivery",
    paymentStatus: "pending",
    createdAt: { toDate: () => new Date() } as any,
    ...overrides,
  } as Order;
}

const fixtureOrders: Order[] = [
  makeOrder({
    id: "order-1",
    status: "delivered",
    total: 500,
    supplierId: "supplier-1",
    items: [
      { productId: "p1", name: "Ethiopian Beans", pricingUnitLabel: "kg", unitPrice: 100, costPrice: 60, quantity: 3, lineTotal: 300 },
      { productId: "p2", name: "Filter Papers", pricingUnitLabel: "pack", unitPrice: 40, quantity: 5, lineTotal: 200 },
    ],
  }),
  makeOrder({
    id: "order-2",
    status: "pending",
    total: 300,
    supplierId: "supplier-2",
    items: [
      { productId: "p1", name: "Ethiopian Beans", pricingUnitLabel: "kg", unitPrice: 100, costPrice: 60, quantity: 2, lineTotal: 200 },
      { productId: "p3", name: "Oat Milk", pricingUnitLabel: "litre", unitPrice: 25, costPrice: 15, quantity: 4, lineTotal: 100 },
    ],
  }),
  makeOrder({
    id: "order-3",
    status: "cancelled",
    total: 150,
    supplierId: "supplier-1",
    items: [
      { productId: "p2", name: "Filter Papers", pricingUnitLabel: "pack", unitPrice: 40, costPrice: 20, quantity: 2, lineTotal: 80 },
      { productId: "p4", name: "Cup Lids", pricingUnitLabel: "box", unitPrice: 70, quantity: 1, lineTotal: 70 },
    ],
  }),
  makeOrder({
    id: "order-4",
    status: "sent_to_supplier",
    total: 200,
    // No supplierId — should be "Unassigned"
    items: [
      { productId: "p1", name: "Ethiopian Beans", pricingUnitLabel: "kg", unitPrice: 100, costPrice: 60, quantity: 2, lineTotal: 200 },
    ],
  }),
];

const fixtureSuppliers: Supplier[] = [
  { id: "supplier-1", name: "Al-Jazeera Coffee Co." } as Supplier,
  { id: "supplier-2", name: "Premium Imports Ltd." } as Supplier,
];

// ---------------------------------------------------------------------------
// Tests: computeOrderMetrics
// ---------------------------------------------------------------------------

describe("computeOrderMetrics", () => {
  it("returns zero metrics for an empty list", () => {
    const result = computeOrderMetrics([]);
    expect(result.totalOrders).toBe(0);
    expect(result.totalRevenue).toBe(0);
    expect(result.ordersByStatus.pending).toBe(0);
    expect(result.ordersByStatus.delivered).toBe(0);
  });

  it("counts total orders correctly", () => {
    const result = computeOrderMetrics(fixtureOrders);
    expect(result.totalOrders).toBe(4);
  });

  it("sums total revenue correctly", () => {
    const result = computeOrderMetrics(fixtureOrders);
    // 500 + 300 + 150 + 200 = 1150
    expect(result.totalRevenue).toBe(1150);
  });

  it("breaks down orders by status", () => {
    const result = computeOrderMetrics(fixtureOrders);
    expect(result.ordersByStatus.delivered).toBe(1);
    expect(result.ordersByStatus.pending).toBe(1);
    expect(result.ordersByStatus.cancelled).toBe(1);
    expect(result.ordersByStatus.sent_to_supplier).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Tests: computeTopProducts
// ---------------------------------------------------------------------------

describe("computeTopProducts", () => {
  it("returns empty arrays for no orders", () => {
    const result = computeTopProducts([]);
    expect(result.topByQuantity).toHaveLength(0);
    expect(result.topByRevenue).toHaveLength(0);
  });

  it("ranks products by quantity sold", () => {
    const result = computeTopProducts(fixtureOrders);
    // Ethiopian Beans: 3 + 2 + 2 = 7 units
    // Filter Papers: 5 + 2 = 7 units
    // Oat Milk: 4 units
    // Cup Lids: 1 unit
    expect(result.topByQuantity[0].quantity).toBeGreaterThanOrEqual(7);
    expect(result.topByQuantity[0].name).toMatch(/Ethiopian Beans|Filter Papers/);
  });

  it("ranks products by revenue", () => {
    const result = computeTopProducts(fixtureOrders);
    // Ethiopian Beans: 300 + 200 + 200 = 700
    // Filter Papers: 200 + 80 = 280
    // Oat Milk: 100
    // Cup Lids: 70
    expect(result.topByRevenue[0].name).toBe("Ethiopian Beans");
    expect(result.topByRevenue[0].revenue).toBe(700);
  });

  it("respects the limit parameter", () => {
    const result = computeTopProducts(fixtureOrders, 2);
    expect(result.topByQuantity).toHaveLength(2);
    expect(result.topByRevenue).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Tests: computeOrdersBySupplier
// ---------------------------------------------------------------------------

describe("computeOrdersBySupplier", () => {
  it("returns empty array for no orders", () => {
    const result = computeOrdersBySupplier([], fixtureSuppliers);
    expect(result).toHaveLength(0);
  });

  it("groups orders by supplier with correct counts and revenue", () => {
    const result = computeOrdersBySupplier(fixtureOrders, fixtureSuppliers);

    const alJazeera = result.find((r) => r.supplierName === "Al-Jazeera Coffee Co.");
    expect(alJazeera).toBeDefined();
    expect(alJazeera!.orderCount).toBe(2); // order-1 and order-3
    expect(alJazeera!.revenue).toBe(650); // 500 + 150

    const premium = result.find((r) => r.supplierName === "Premium Imports Ltd.");
    expect(premium).toBeDefined();
    expect(premium!.orderCount).toBe(1);
    expect(premium!.revenue).toBe(300);
  });

  it("groups orders without a supplierId as 'Unassigned'", () => {
    const result = computeOrdersBySupplier(fixtureOrders, fixtureSuppliers);
    const unassigned = result.find((r) => r.supplierName === "Unassigned");
    expect(unassigned).toBeDefined();
    expect(unassigned!.orderCount).toBe(1);
    expect(unassigned!.revenue).toBe(200);
  });

  it("sorts results by revenue descending", () => {
    const result = computeOrdersBySupplier(fixtureOrders, fixtureSuppliers);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].revenue).toBeGreaterThanOrEqual(result[i].revenue);
    }
  });

  it("labels unknown supplier IDs as 'Unknown Supplier'", () => {
    const ordersWithUnknown = [
      makeOrder({ id: "x", status: "pending", total: 100, supplierId: "non-existent", items: [{ productId: "p1", name: "X", pricingUnitLabel: "kg", unitPrice: 100, quantity: 1, lineTotal: 100 }] }),
    ];
    const result = computeOrdersBySupplier(ordersWithUnknown, fixtureSuppliers);
    expect(result[0].supplierName).toBe("Unknown Supplier");
  });
});

// ---------------------------------------------------------------------------
// Tests: computeEstimatedProfit
// ---------------------------------------------------------------------------

describe("computeEstimatedProfit", () => {
  it("returns hasCostData=false when no items have cost prices", () => {
    const noCostOrders = [
      makeOrder({
        status: "delivered",
        total: 200,
        items: [
          { productId: "p1", name: "A", pricingUnitLabel: "kg", unitPrice: 100, quantity: 2, lineTotal: 200 },
        ],
      }),
    ];
    const result = computeEstimatedProfit(noCostOrders);
    expect(result.hasCostData).toBe(false);
    expect(result.estimatedProfit).toBe(0);
    expect(result.itemsWithCostData).toBe(0);
  });

  it("calculates profit correctly when all items have cost prices", () => {
    const allCostOrders = [
      makeOrder({
        status: "delivered",
        total: 400,
        items: [
          { productId: "p1", name: "A", pricingUnitLabel: "kg", unitPrice: 100, costPrice: 60, quantity: 3, lineTotal: 300 },
          { productId: "p2", name: "B", pricingUnitLabel: "pack", unitPrice: 25, costPrice: 15, quantity: 4, lineTotal: 100 },
        ],
      }),
    ];
    const result = computeEstimatedProfit(allCostOrders);
    // Revenue with cost data: 300 + 100 = 400
    // Total cost: (60*3) + (15*4) = 180 + 60 = 240
    // Profit: 400 - 240 = 160
    expect(result.hasCostData).toBe(true);
    expect(result.isPartial).toBe(false);
    expect(result.estimatedProfit).toBe(160);
    expect(result.revenueWithCostData).toBe(400);
    expect(result.totalCost).toBe(240);
    expect(result.itemsWithCostData).toBe(2);
    expect(result.totalItems).toBe(2);
  });

  it("marks calculation as partial when some items lack cost prices", () => {
    const result = computeEstimatedProfit(fixtureOrders);
    // Items with costPrice: Ethiopian Beans (3 occurrences), Oat Milk, Filter Papers (in order-3)
    // Items without costPrice: Filter Papers (in order-1), Cup Lids
    expect(result.hasCostData).toBe(true);
    expect(result.isPartial).toBe(true);
    expect(result.itemsWithCostData).toBeLessThan(result.totalItems);
  });

  it("computes correct profit from fixture orders", () => {
    const result = computeEstimatedProfit(fixtureOrders);
    // Items with costPrice:
    // order-1: Ethiopian Beans: lineTotal=300, cost=60*3=180
    // order-2: Ethiopian Beans: lineTotal=200, cost=60*2=120; Oat Milk: lineTotal=100, cost=15*4=60
    // order-3: Filter Papers: lineTotal=80, cost=20*2=40
    // order-4: Ethiopian Beans: lineTotal=200, cost=60*2=120
    // Revenue with cost = 300 + 200 + 100 + 80 + 200 = 880
    // Total cost = 180 + 120 + 60 + 40 + 120 = 520
    // Profit = 880 - 520 = 360
    expect(result.revenueWithCostData).toBe(880);
    expect(result.totalCost).toBe(520);
    expect(result.estimatedProfit).toBe(360);
  });

  it("returns zero metrics for an empty orders list", () => {
    const result = computeEstimatedProfit([]);
    expect(result.hasCostData).toBe(false);
    expect(result.estimatedProfit).toBe(0);
    expect(result.totalItems).toBe(0);
  });

  it("treats costPrice=0 and costPrice=null as no cost data", () => {
    const orders = [
      makeOrder({
        status: "delivered",
        total: 300,
        items: [
          { productId: "p1", name: "Zero Cost", pricingUnitLabel: "kg", unitPrice: 100, costPrice: 0, quantity: 2, lineTotal: 200 },
          { productId: "p2", name: "Null Cost", pricingUnitLabel: "pack", unitPrice: 50, costPrice: undefined, quantity: 2, lineTotal: 100 },
        ],
      }),
    ];
    const result = computeEstimatedProfit(orders);
    // costPrice=0 and costPrice=undefined should both be excluded
    expect(result.itemsWithCostData).toBe(0);
    expect(result.itemsWithoutCostData).toBe(2);
    expect(result.hasCostData).toBe(false);
    expect(result.estimatedProfit).toBe(0);
  });
});
