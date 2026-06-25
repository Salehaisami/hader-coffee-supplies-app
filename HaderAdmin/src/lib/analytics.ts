import { type Order, type OrderStatus, type Supplier } from "@/lib/types";

/**
 * Metrics computed from a list of orders, used by the analytics dashboard.
 */
export interface OrderMetrics {
  /** Total number of orders. */
  totalOrders: number;
  /** Sum of all order totals (SAR). */
  totalRevenue: number;
  /** Count of orders grouped by status. */
  ordersByStatus: Record<OrderStatus, number>;
}

/** A product entry ranked by total quantity sold. */
export interface TopProductByQuantity {
  name: string;
  quantity: number;
}

/** A product entry ranked by total revenue generated. */
export interface TopProductByRevenue {
  name: string;
  revenue: number;
}

/** Return type for `computeTopProducts`. */
export interface TopProducts {
  topByQuantity: TopProductByQuantity[];
  topByRevenue: TopProductByRevenue[];
}

/**
 * Computes aggregate order metrics from a list of orders.
 *
 * Pure function — no side effects or Firestore calls. Designed for easy
 * unit testing (T6.6.5) and reuse across analytics components.
 */
export function computeOrderMetrics(orders: Order[]): OrderMetrics {
  const ordersByStatus: Record<OrderStatus, number> = {
    pending: 0,
    sent_to_supplier: 0,
    delivered: 0,
    cancelled: 0,
  };

  let totalRevenue = 0;
  let totalOrders = 0;

  for (const order of orders) {
    ordersByStatus[order.status] = (ordersByStatus[order.status] ?? 0) + 1;

    // Exclude cancelled orders from revenue and order count
    if (order.status !== "cancelled") {
      totalRevenue += order.total ?? 0;
      totalOrders += 1;
    }
  }

  return {
    totalOrders,
    totalRevenue,
    ordersByStatus,
  };
}

/**
 * Computes the top-selling products by quantity and by revenue.
 *
 * Aggregates all line items across all orders, grouping by product name.
 * Returns two ranked lists: one sorted by total units sold, the other by
 * total revenue generated.
 *
 * @param orders - The full list of orders to aggregate.
 * @param limit  - Maximum number of products to return in each list (default 5).
 */
export function computeTopProducts(
  orders: Order[],
  limit: number = 5
): TopProducts {
  const quantityMap = new Map<string, number>();
  const revenueMap = new Map<string, number>();

  for (const order of orders) {
    if (order.status === "cancelled") continue;
    for (const item of order.items) {
      const name = item.name;
      quantityMap.set(name, (quantityMap.get(name) ?? 0) + item.quantity);
      revenueMap.set(name, (revenueMap.get(name) ?? 0) + item.lineTotal);
    }
  }

  const topByQuantity: TopProductByQuantity[] = [...quantityMap.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);

  const topByRevenue: TopProductByRevenue[] = [...revenueMap.entries()]
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);

  return { topByQuantity, topByRevenue };
}

/** A single supplier's order breakdown entry. */
export interface SupplierBreakdown {
  supplierName: string;
  orderCount: number;
  revenue: number;
}

/**
 * Groups orders by supplier, returning each supplier's order count and revenue,
 * sorted by revenue descending.
 *
 * Orders without a `supplierId` (or with null/empty value) are grouped under
 * the provided `unassignedLabel`.
 *
 * @param orders    - The full list of orders to aggregate.
 * @param suppliers - The list of suppliers used to resolve names from IDs.
 * @param labels    - Localized labels for unassigned/unknown suppliers.
 */
export function computeOrdersBySupplier(
  orders: Order[],
  suppliers: Supplier[],
  labels: { unassigned: string; unknownSupplier: string } = { unassigned: "Unassigned", unknownSupplier: "Unknown Supplier" }
): SupplierBreakdown[] {
  const supplierNameMap = new Map<string, string>();
  for (const s of suppliers) {
    supplierNameMap.set(s.id, s.name);
  }

  const aggregation = new Map<string, { orderCount: number; revenue: number }>();

  for (const order of orders) {
    if (order.status === "cancelled") continue;
    const supplierId = order.supplierId ?? null;
    const key = supplierId || "__unassigned__";

    const existing = aggregation.get(key) ?? { orderCount: 0, revenue: 0 };
    existing.orderCount += 1;
    existing.revenue += order.total ?? 0;
    aggregation.set(key, existing);
  }

  const results: SupplierBreakdown[] = [];
  for (const [key, data] of aggregation.entries()) {
    const supplierName =
      key === "__unassigned__"
        ? labels.unassigned
        : supplierNameMap.get(key) ?? labels.unknownSupplier;
    results.push({ supplierName, orderCount: data.orderCount, revenue: data.revenue });
  }

  results.sort((a, b) => b.revenue - a.revenue);
  return results;
}


/** Result of estimated profit calculation. */
export interface ProfitEstimate {
  /** Estimated profit: sum of (unitPrice - costPrice) * quantity for items with cost data. */
  estimatedProfit: number;
  /** Total revenue from items that have cost price data. */
  revenueWithCostData: number;
  /** Total cost across items that have cost price data. */
  totalCost: number;
  /** Number of line items that have a costPrice value. */
  itemsWithCostData: number;
  /** Number of line items that do NOT have a costPrice value. */
  itemsWithoutCostData: number;
  /** Total number of line items across all orders. */
  totalItems: number;
  /** Whether the calculation is based on partial data (not all items have cost prices). */
  isPartial: boolean;
  /** Whether any cost data exists at all (controls visibility of the card). */
  hasCostData: boolean;
}

/**
 * Computes estimated profit from orders where line items include a `costPrice`.
 *
 * Profit for each item = lineTotal - (costPrice × quantity).
 * Only items with a defined `costPrice` are included. If some items are missing
 * cost data, the result is flagged as partial.
 *
 * @param orders - The full list of orders to aggregate.
 */
export function computeEstimatedProfit(orders: Order[]): ProfitEstimate {
  let revenueWithCostData = 0;
  let totalCost = 0;
  let itemsWithCostData = 0;
  let totalItems = 0;

  for (const order of orders) {
    for (const item of order.items) {
      totalItems += 1;
      if (item.costPrice != null && item.costPrice > 0) {
        itemsWithCostData += 1;
        revenueWithCostData += item.lineTotal;
        totalCost += item.costPrice * item.quantity;
      }
    }
  }

  const estimatedProfit = revenueWithCostData - totalCost;
  const itemsWithoutCostData = totalItems - itemsWithCostData;
  const hasCostData = itemsWithCostData > 0;
  const isPartial = hasCostData && itemsWithCostData < totalItems;

  return {
    estimatedProfit,
    revenueWithCostData,
    totalCost,
    itemsWithCostData,
    itemsWithoutCostData,
    totalItems,
    isPartial,
    hasCostData,
  };
}
