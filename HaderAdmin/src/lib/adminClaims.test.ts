import { describe, it, expect } from "vitest";
import type { ParsedToken } from "firebase/auth";
import { claimsIndicateAdmin, ADMIN_ROLE } from "./adminClaims";

describe("claimsIndicateAdmin", () => {
  it("returns true when role claim is exactly 'admin'", () => {
    const claims = { role: "admin" } as ParsedToken;
    expect(claimsIndicateAdmin(claims)).toBe(true);
  });

  it("uses the ADMIN_ROLE constant as the required role value", () => {
    const claims = { role: ADMIN_ROLE } as ParsedToken;
    expect(claimsIndicateAdmin(claims)).toBe(true);
  });

  it("returns false when role claim is a different role", () => {
    const claims = { role: "customer" } as ParsedToken;
    expect(claimsIndicateAdmin(claims)).toBe(false);
  });

  it("returns false when role claim is absent", () => {
    const claims = { sub: "uid-123", email: "user@example.com" } as ParsedToken;
    expect(claimsIndicateAdmin(claims)).toBe(false);
  });

  it("returns false for null or undefined claims", () => {
    expect(claimsIndicateAdmin(null)).toBe(false);
    expect(claimsIndicateAdmin(undefined)).toBe(false);
  });

  it("is case-sensitive and rejects non-exact matches like 'Admin'", () => {
    expect(claimsIndicateAdmin({ role: "Admin" } as ParsedToken)).toBe(false);
    expect(claimsIndicateAdmin({ role: "ADMIN" } as ParsedToken)).toBe(false);
  });

  it("returns false when role is a truthy non-string (e.g. boolean true)", () => {
    expect(
      claimsIndicateAdmin({ role: true } as unknown as ParsedToken)
    ).toBe(false);
  });
});
