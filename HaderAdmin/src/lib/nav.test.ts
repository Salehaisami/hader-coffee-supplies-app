import { describe, it, expect } from "vitest";
import { isNavItemActive } from "./nav";

describe("isNavItemActive", () => {
  it("matches the dashboard home only on an exact '/' path", () => {
    expect(isNavItemActive("/", "/")).toBe(true);
    expect(isNavItemActive("/orders", "/")).toBe(false);
    expect(isNavItemActive("/orders/123", "/")).toBe(false);
  });

  it("matches a section route exactly", () => {
    expect(isNavItemActive("/orders", "/orders")).toBe(true);
    expect(isNavItemActive("/catalog", "/catalog")).toBe(true);
  });

  it("matches nested paths under a section route", () => {
    expect(isNavItemActive("/orders/123", "/orders")).toBe(true);
    expect(isNavItemActive("/catalog/products/abc", "/catalog")).toBe(true);
  });

  it("does not match a different section", () => {
    expect(isNavItemActive("/orders", "/catalog")).toBe(false);
    expect(isNavItemActive("/suppliers", "/customers")).toBe(false);
  });

  it("does not match on a shared prefix that is not a path segment boundary", () => {
    // "/ordersxyz" should NOT activate the "/orders" item.
    expect(isNavItemActive("/ordersxyz", "/orders")).toBe(false);
  });
});
