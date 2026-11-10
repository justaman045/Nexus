// Server-side FX rate authority. Payment routes use this to compute the
// chargeable amount from the product's USD price so the client can never
// dictate the price.
//
// Rates are cached in-memory (1h TTL). A hardcoded fallback keeps checkout
// working if the FX API is unreachable.

interface RateCache {
  rates: Record<string, number>;
  timestamp: number;
}

const RATE_TTL = 60 * 60 * 1000; // 1 hour
let rateCache: RateCache | null = null;

// Approximate fallback rates (USD base) so checkout never breaks offline.
const FALLBACK_RATES: Record<string, number> = {
  USD: 1, INR: 84, EUR: 0.92, GBP: 0.79, JPY: 149, AUD: 1.53, CAD: 1.36,
  SGD: 1.34, AED: 3.67, BRL: 4.97, MXN: 17.2, CHF: 0.90, SEK: 10.4,
  NOK: 10.6, DKK: 6.88, PLN: 3.98, CNY: 7.24, KRW: 1320, THB: 35.1,
  MYR: 4.69, IDR: 15600, PHP: 56.4, VND: 24500, ZAR: 18.6, NGN: 1600,
  KES: 129, PKR: 278, BDT: 110, SAR: 3.75, QAR: 3.64, NZD: 1.63,
  HKD: 7.82, TWD: 31.5, TRY: 32.1, RUB: 90, ILS: 3.65,
};

// Stripe's zero-decimal currencies (priced in whole units, no minor subunits).
const STRIPE_ZERO_DECIMAL = new Set([
  "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF",
  "UGX", "VND", "XAF", "XOF", "XPF",
]);

export function gatewayMinorMultiplier(code: string): number {
  return STRIPE_ZERO_DECIMAL.has(code) ? 1 : 100;
}

export async function getServerFxRates(): Promise<Record<string, number>> {
  if (rateCache && Date.now() - rateCache.timestamp < RATE_TTL) {
    return rateCache.rates;
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    if (data?.rates) {
      rateCache = { rates: data.rates, timestamp: Date.now() };
      return data.rates;
    }
  } catch {
    // fall through to fallback below
  }

  rateCache = { rates: FALLBACK_RATES, timestamp: Date.now() };
  return FALLBACK_RATES;
}

/** Convert a USD major-unit amount to the target currency's minor subunits
 *  (e.g. paise for INR, cents for USD), rounded to the nearest subunit. */
export async function usdToMinorUnits(usdAmount: number, currency: string): Promise<number> {
  const rates = await getServerFxRates();
  const rate = rates[currency];
  if (!rate) throw new Error(`Unsupported currency: ${currency}`);
  return Math.round(usdAmount * rate * gatewayMinorMultiplier(currency));
}

/** Convert a USD major-unit amount to the target currency's major units
 *  (e.g. rupees for INR), rounded to the currency's display precision. */
export async function usdToMajorUnits(usdAmount: number, currency: string): Promise<number> {
  const minor = await usdToMinorUnits(usdAmount, currency);
  return minor / gatewayMinorMultiplier(currency);
}
