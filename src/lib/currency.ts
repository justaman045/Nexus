// Country code → ISO 4217 currency code
export const COUNTRY_CURRENCY: Record<string, string> = {
  US: "USD", IN: "INR", GB: "GBP", JP: "JPY", AU: "AUD", CA: "CAD",
  DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR", BE: "EUR",
  PT: "EUR", AT: "EUR", FI: "EUR", GR: "EUR", IE: "EUR", LU: "EUR",
  CY: "EUR", EE: "EUR", LV: "EUR", LT: "EUR", MT: "EUR", SK: "EUR",
  SI: "EUR", HR: "EUR",
  SG: "SGD", AE: "AED", BR: "BRL", MX: "MXN", CH: "CHF",
  SE: "SEK", NO: "NOK", DK: "DKK", PL: "PLN",
  CN: "CNY", KR: "KRW", TH: "THB", MY: "MYR", ID: "IDR",
  PH: "PHP", VN: "VND", ZA: "ZAR", NG: "NGN", KE: "KES",
  PK: "PKR", BD: "BDT", LK: "LKR", NP: "NPR",
  SA: "SAR", QA: "QAR", KW: "KWD", BH: "BHD",
  EG: "EGP", MA: "MAD", TZ: "TZS", GH: "GHS",
  AR: "ARS", CL: "CLP", CO: "COP", PE: "PEN",
  NZ: "NZD", HK: "HKD", TW: "TWD",
  RU: "RUB", UA: "UAH", TR: "TRY", IL: "ILS",
};

export interface CurrencyInfo {
  code: string;
  symbol: string;
  decimals: number;
  name: string;
}

export const CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: "USD", symbol: "$",    decimals: 2, name: "US Dollar" },
  INR: { code: "INR", symbol: "₹",   decimals: 0, name: "Indian Rupee" },
  EUR: { code: "EUR", symbol: "€",   decimals: 2, name: "Euro" },
  GBP: { code: "GBP", symbol: "£",   decimals: 2, name: "British Pound" },
  JPY: { code: "JPY", symbol: "¥",   decimals: 0, name: "Japanese Yen" },
  AUD: { code: "AUD", symbol: "A$",  decimals: 2, name: "Australian Dollar" },
  CAD: { code: "CAD", symbol: "C$",  decimals: 2, name: "Canadian Dollar" },
  SGD: { code: "SGD", symbol: "S$",  decimals: 2, name: "Singapore Dollar" },
  AED: { code: "AED", symbol: "د.إ", decimals: 2, name: "UAE Dirham" },
  BRL: { code: "BRL", symbol: "R$",  decimals: 2, name: "Brazilian Real" },
  MXN: { code: "MXN", symbol: "MX$", decimals: 2, name: "Mexican Peso" },
  CHF: { code: "CHF", symbol: "Fr",  decimals: 2, name: "Swiss Franc" },
  SEK: { code: "SEK", symbol: "kr",  decimals: 2, name: "Swedish Krona" },
  NOK: { code: "NOK", symbol: "kr",  decimals: 2, name: "Norwegian Krone" },
  DKK: { code: "DKK", symbol: "kr",  decimals: 2, name: "Danish Krone" },
  PLN: { code: "PLN", symbol: "zł",  decimals: 2, name: "Polish Zloty" },
  CNY: { code: "CNY", symbol: "¥",   decimals: 2, name: "Chinese Yuan" },
  KRW: { code: "KRW", symbol: "₩",   decimals: 0, name: "South Korean Won" },
  THB: { code: "THB", symbol: "฿",   decimals: 2, name: "Thai Baht" },
  MYR: { code: "MYR", symbol: "RM",  decimals: 2, name: "Malaysian Ringgit" },
  IDR: { code: "IDR", symbol: "Rp",  decimals: 0, name: "Indonesian Rupiah" },
  PHP: { code: "PHP", symbol: "₱",   decimals: 2, name: "Philippine Peso" },
  VND: { code: "VND", symbol: "₫",   decimals: 0, name: "Vietnamese Dong" },
  ZAR: { code: "ZAR", symbol: "R",   decimals: 2, name: "South African Rand" },
  NGN: { code: "NGN", symbol: "₦",   decimals: 0, name: "Nigerian Naira" },
  KES: { code: "KES", symbol: "KSh", decimals: 0, name: "Kenyan Shilling" },
  PKR: { code: "PKR", symbol: "₨",   decimals: 0, name: "Pakistani Rupee" },
  BDT: { code: "BDT", symbol: "৳",   decimals: 0, name: "Bangladeshi Taka" },
  SAR: { code: "SAR", symbol: "ر.س", decimals: 2, name: "Saudi Riyal" },
  QAR: { code: "QAR", symbol: "ر.ق", decimals: 2, name: "Qatari Riyal" },
  NZD: { code: "NZD", symbol: "NZ$", decimals: 2, name: "New Zealand Dollar" },
  HKD: { code: "HKD", symbol: "HK$", decimals: 2, name: "Hong Kong Dollar" },
  TWD: { code: "TWD", symbol: "NT$", decimals: 0, name: "Taiwan Dollar" },
  TRY: { code: "TRY", symbol: "₺",   decimals: 2, name: "Turkish Lira" },
  RUB: { code: "RUB", symbol: "₽",   decimals: 0, name: "Russian Ruble" },
  ILS: { code: "ILS", symbol: "₪",   decimals: 2, name: "Israeli Shekel" },
};

export const USD: CurrencyInfo = CURRENCIES.USD;

// Format a converted price with the right symbol and decimals
export function formatPrice(amount: number, currency: CurrencyInfo): string {
  const rounded = currency.decimals === 0 ? Math.round(amount) : Number(amount.toFixed(currency.decimals));
  return `${currency.symbol}${rounded.toLocaleString()}`;
}

interface RateCache {
  rates: Record<string, number>;
  timestamp: number;
}

interface GeoCache {
  countryCode: string;
  currencyCode: string;
  timestamp: number;
}

const RATE_TTL = 60 * 60 * 1000;   // 1 hour
const GEO_TTL  = 24 * 60 * 60 * 1000; // 24 hours

function getRateCache(): RateCache | null {
  try {
    const raw = localStorage.getItem("nx_rates");
    if (!raw) return null;
    const cached: RateCache = JSON.parse(raw);
    if (Date.now() - cached.timestamp > RATE_TTL) return null;
    return cached;
  } catch { return null; }
}

function setRateCache(rates: Record<string, number>) {
  try { localStorage.setItem("nx_rates", JSON.stringify({ rates, timestamp: Date.now() })); } catch {}
}

function getGeoCache(): GeoCache | null {
  try {
    const raw = sessionStorage.getItem("nx_geo");
    if (!raw) return null;
    const cached: GeoCache = JSON.parse(raw);
    if (Date.now() - cached.timestamp > GEO_TTL) return null;
    return cached;
  } catch { return null; }
}

function setGeoCache(countryCode: string, currencyCode: string) {
  try { sessionStorage.setItem("nx_geo", JSON.stringify({ countryCode, currencyCode, timestamp: Date.now() })); } catch {}
}

// Detect currency from IP geolocation, with timezone fallback
export async function detectCurrency(): Promise<string> {
  const geo = getGeoCache();
  if (geo) return geo.currencyCode;

  // Try IP geolocation
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) });
    const data = await res.json();
    const countryCode: string = data.country_code || "US";
    const currencyCode: string = data.currency || COUNTRY_CURRENCY[countryCode] || "USD";
    setGeoCache(countryCode, currencyCode);
    return CURRENCIES[currencyCode] ? currencyCode : "USD";
  } catch {}

  // Timezone fallback
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.includes("Kolkata") || tz.includes("Calcutta")) return "INR";
    if (tz.includes("Tokyo"))   return "JPY";
    if (tz.includes("Seoul"))   return "KRW";
    if (tz.includes("Shanghai") || tz.includes("Beijing")) return "CNY";
    if (tz.includes("London"))  return "GBP";
    if (tz.includes("Dubai"))   return "AED";
    if (tz.includes("Singapore")) return "SGD";
    if (tz.includes("Sydney") || tz.includes("Melbourne")) return "AUD";
    if (tz.includes("Toronto") || tz.includes("Vancouver")) return "CAD";
    if (tz.includes("Sao_Paulo")) return "BRL";
    if (tz.startsWith("Europe/")) return "EUR";
  } catch {}

  return "USD";
}

// Fetch exchange rates (USD base), with localStorage cache
export async function fetchRates(): Promise<Record<string, number>> {
  const cached = getRateCache();
  if (cached) return cached.rates;

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    if (data?.rates) {
      setRateCache(data.rates);
      return data.rates;
    }
  } catch {}

  // Fallback hardcoded rates (approximate) so the UI never breaks
  return {
    USD: 1, INR: 84, EUR: 0.92, GBP: 0.79, JPY: 149, AUD: 1.53, CAD: 1.36,
    SGD: 1.34, AED: 3.67, BRL: 4.97, MXN: 17.2, CHF: 0.90, SEK: 10.4,
    NOK: 10.6, DKK: 6.88, PLN: 3.98, CNY: 7.24, KRW: 1320, THB: 35.1,
    MYR: 4.69, IDR: 15600, PHP: 56.4, VND: 24500, ZAR: 18.6, NGN: 1600,
    KES: 129, PKR: 278, BDT: 110, SAR: 3.75, QAR: 3.64, NZD: 1.63,
    HKD: 7.82, TWD: 31.5, TRY: 32.1, RUB: 90, ILS: 3.65,
  };
}
