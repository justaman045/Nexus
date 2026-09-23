"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { detectCurrency, fetchRates, formatPrice, USD, CURRENCIES, CurrencyInfo } from "@/lib/currency";
import { getPaymentSettings } from "@/lib/paymentSettings";

interface CurrencyContextValue {
  currency: CurrencyInfo;
  rate: number;
  rates: Record<string, number>;
  /** Convert a USD price to the active currency amount */
  convert: (usdPrice: number) => number;
  /** Convert a USD price to any supported currency */
  convertTo: (code: string, usdPrice: number) => number;
  /** Format a USD price as a localised string e.g. "₹1,650" */
  format: (usdPrice: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: USD,
  rate: 1,
  rates: {},
  convert: (p) => p,
  convertTo: (_, p) => p,
  format: (p) => `$${p}`,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyInfo>(USD);
  const [rate, setRate] = useState(1);
  const [rates, setRates] = useState<Record<string, number>>({});

  useEffect(() => {
    async function init() {
      try {
        const settings = await getPaymentSettings();
        const enabled = settings.multiCurrencyEnabled !== false; // default true
        if (!enabled) { setCurrency(USD); setRate(1); setRates({}); return; }

        const [currencyCode, rateMap] = await Promise.all([detectCurrency(), fetchRates()]);
        const r = rateMap[currencyCode] ?? 1;
        setRates(rateMap);
        setCurrency(CURRENCIES[currencyCode] ?? USD);
        setRate(r);
      } catch (error) {
        console.error("Currency init failed:", error);
        // network failure — silently fall back to USD
      }
    }
    init();
  }, []);

  const convert = (usdPrice: number) => usdPrice * rate;
  const convertTo = (code: string, usdPrice: number) => {
    const r = rates[code];
    return r ? usdPrice * r : usdPrice;
  };
  const format = (usdPrice: number) => formatPrice(usdPrice * rate, currency);

  return (
    <CurrencyContext.Provider value={{ currency, rate, rates, convert, convertTo, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}