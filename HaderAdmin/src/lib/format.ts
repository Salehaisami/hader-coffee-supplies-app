import { type Timestamp } from "firebase/firestore";

/**
 * Formatting helpers shared across dashboard views.
 *
 * All number/currency formatting uses Western (Latin) digits via the
 * "en-US" locale so values render consistently regardless of browser locale.
 */

/**
 * Builds a Google Maps deep link that drops a pin at the given coordinates.
 *
 * Uses the Maps URL API search endpoint:
 *   https://www.google.com/maps/search/?api=1&query=LAT,LNG
 *
 * @param lat Latitude in decimal degrees.
 * @param lng Longitude in decimal degrees.
 * @returns A fully-formed, URL-encoded Google Maps link.
 */
export function googleMapsSearchUrl(lat: number, lng: number): string {
  const query = encodeURIComponent(`${lat},${lng}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/** Formats a number as SAR currency using Western digits (e.g. "SAR 1,250.00"). */
export function formatSar(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "SAR",
    currencyDisplay: "code",
  }).format(amount);
}

/** Formats a plain number with grouping using Western digits (e.g. "1,250"). */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Formats a Firestore Timestamp as a short, human-readable date/time.
 * Returns an em dash when the timestamp is missing (e.g. pending server write).
 */
export function formatTimestamp(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp.toDate());
}

/** Returns a shortened order id suitable for compact list display. */
export function shortOrderId(id: string): string {
  return id.length > 8 ? id.slice(0, 8) : id;
}
