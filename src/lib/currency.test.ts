import { describe, expect, it } from "vitest";
import {
  currencyDecimals,
  CURRENCIES,
  formatPrice,
  gatewayMinorMultiplier,
  COUNTRY_CURRENCY,
} from "./currency";

describe("currencyDecimals", () => {
  it("uses 2 decimals by default", () => {
    expect(currencyDecimals("USD")).toBe(2);
    expect(currencyDecimals("EUR")).toBe(2);
  });

  it("uses 0 decimals for zero-decimal display currencies", () => {
    expect(currencyDecimals("INR")).toBe(0);
    expect(currencyDecimals("JPY")).toBe(0);
    expect(currencyDecimals("VND")).toBe(0);
  });

  it("falls back to 2 for unknown codes", () => {
    expect(currencyDecimals("AAA")).toBe(2);
  });
});

describe("gatewayMinorMultiplier", () => {
  it("returns 1 for gateway zero-decimal currencies", () => {
    expect(gatewayMinorMultiplier("JPY")).toBe(1);
    expect(gatewayMinorMultiplier("KRW")).toBe(1);
    expect(gatewayMinorMultiplier("VND")).toBe(1);
  });

  it("returns 100 for everything else (INR included)", () => {
    expect(gatewayMinorMultiplier("INR")).toBe(100);
    expect(gatewayMinorMultiplier("USD")).toBe(100);
    expect(gatewayMinorMultiplier("EUR")).toBe(100);
  });
});

describe("formatPrice", () => {
  it("formats with the currency symbol and decimals", () => {
    expect(formatPrice(1249.5, CURRENCIES.USD)).toBe("$1,249.5");
  });

  it("rounds zero-decimal currencies to whole units", () => {
    expect(formatPrice(84.6, CURRENCIES.INR)).toBe("₹85");
  });

  it("keeps negative/zero inputs sane", () => {
    expect(formatPrice(0, CURRENCIES.USD)).toBe("$0");
  });
});

describe("COUNTRY_CURRENCY", () => {
  it("maps India to INR and the UK to GBP", () => {
    expect(COUNTRY_CURRENCY.IN).toBe("INR");
    expect(COUNTRY_CURRENCY.GB).toBe("GBP");
    expect(COUNTRY_CURRENCY.US).toBe("USD");
  });

  it("maps all EU countries to EUR", () => {
    expect(COUNTRY_CURRENCY.DE).toBe("EUR");
    expect(COUNTRY_CURRENCY.FR).toBe("EUR");
    expect(COUNTRY_CURRENCY.IE).toBe("EUR");
  });
});