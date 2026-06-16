/**
 * Determines whether a sidebar nav item is active for the given pathname.
 *
 * The dashboard home ("/") is matched exactly so it is not highlighted on
 * every nested route. Section routes match the route itself and any nested
 * paths (e.g. "/orders" is active on "/orders/123").
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
