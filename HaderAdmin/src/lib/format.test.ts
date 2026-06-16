import { describe, it, expect } from "vitest";
import {
  googleMapsSearchUrl,
  formatSar,
  formatNumber,
  shortOrderId,
} from "./format";

describe("googleMapsSearchUrl", () => {
  it("builds a search deep link from latitude and longitude", () => {
    expect(googleMapsSearchUrl(24.7136, 46.6753)).toBe(
      "https://www.google.com/maps/search/?api=1&query=24.7136%2C46.6753"
    );
  });

  it("uses the documented api=1 search endpoint", () => {
    const url = googleMapsSearchUrl(0, 0);
    expect(url.startsWith("https://www.google.com/maps/search/?api=1&query=")).toBe(
      true
    );
  });

  it("URL-encodes the comma between coordinates", () => {
    const url = googleMapsSearchUrl(10, 20);
    expect(url).toContain("query=10%2C20");
    // Raw, unencoded comma must not appear in the query value.
    expect(url).not.toContain("query=10,20");
  });

  it("handles negative coordinates", () => {
    expect(googleMapsSearchUrl(-33.8688, -151.2093)).toBe(
      "https://www.google.com/maps/search/?api=1&query=-33.8688%2C-151.2093"
    );
  });
});

// Intl currency formatting separates the code and amount with a non-breaking
// space (U+00A0); normalize to a regular space for stable assertions.
const normalizeSpaces = (s: string) => s.replace(/\u00a0/g, " ");

describe("formatSar", () => {
  it("formats with the SAR currency code and Western digits", () => {
    expect(normalizeSpaces(formatSar(1250))).toBe("SAR 1,250.00");
  });

  it("formats zero", () => {
    expect(normalizeSpaces(formatSar(0))).toBe("SAR 0.00");
  });
});

describe("formatNumber", () => {
  it("groups thousands with Western digits", () => {
    expect(formatNumber(1250)).toBe("1,250");
  });
});

describe("shortOrderId", () => {
  it("truncates long ids to 8 characters", () => {
    expect(shortOrderId("abcdefghijklmnop")).toBe("abcdefgh");
  });

  it("returns short ids unchanged", () => {
    expect(shortOrderId("abc123")).toBe("abc123");
  });
});
