"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { detectCurrency, fetchRates, formatPrice, USD, CURRENCIES, CurrencyInfo } from "@/lib/currency";
import { getPaymentSettings } from "@/lib/paymentSettings";

interface CurrencyContextValue {
  currency: CurrencyInfo;
  rate: number;
  loading: boolean;
  /** Convert a USD price to the active currency amount */
  convert: (usdPrice: number) => number;
  /** Format a USD price as a localised string e.g. "₹1,650" */
  format: (usdPrice: number) => string;
  /** True if multi-currency is enabled by admin */
  multiCurrencyEnabled: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: USD,
  rate: 1,
  loading: true,
  convert: (p) => p,
  format: (p) => `$${p}`,
  multiCurrencyEnabled: true,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyInfo>(USD);
  const [rate, setRate] = useState(1);
  const [loading, setLoading] = useState(true);
  const [multiCurrencyEnabled, setMultiCurrencyEnabled] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const settings = await getPaymentSettings();
        const enabled = settings.multiCurrencyEnabled !== false; // default true
        setMultiCurrencyEnabled(enabled);

        if (!enabled) { setLoading(false); return; } // stay USD

        const [currencyCode, rates] = await Promise.all([detectCurrency(), fetchRates()]);
        const info = CURRENCIES[currencyCode] ?? USD;
        const r = rates[currencyCode] ?? 1;
        setCurrency(info);
        setRate(r);
      } catch {
        // network failure — silently fall back to USD
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const convert = (usdPrice: number) => usdPrice * rate;
  const format = (usdPrice: number) => formatPrice(usdPrice * rate, currency);

  return (
    <CurrencyContext.Provider value={{ currency, rate, loading, convert, format, multiCurrencyEnabled }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
