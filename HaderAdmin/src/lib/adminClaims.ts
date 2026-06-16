import type { ParsedToken } from "firebase/auth";

/**
 * The custom claim value that grants admin access to the dashboard.
 * Admin accounts are provisioned manually with this claim set on the
 * Firebase Auth user (see Phase1-Resolved-Decisions.md §10).
 */
export const ADMIN_ROLE = "admin";

/**
 * Pure predicate that determines whether a set of Firebase Auth custom
 * claims grants admin access. A user is an admin only when the `role`
 * claim is exactly `"admin"`.
 *
 * Kept free of any Firebase SDK calls so it can be unit tested in isolation.
 */
export function claimsIndicateAdmin(
  claims: ParsedToken | null | undefined
): boolean {
  return claims?.role === ADMIN_ROLE;
}
