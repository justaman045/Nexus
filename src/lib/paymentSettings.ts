import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export type PaymentGateway = "razorpay" | "stripe";

export interface PaymentSettings {
  gateway: PaymentGateway;
  multiCurrencyEnabled: boolean;
  updatedAt: string;
}

let cached: PaymentSettings | null = null;
let cacheTime = 0;
const TTL = 30 * 1000; // 30 seconds — short so switching takes effect quickly

export async function getPaymentSettings(): Promise<PaymentSettings> {
  if (cached && Date.now() - cacheTime < TTL) return cached;
  let stored: Partial<PaymentSettings> = {};
  try {
    const snap = await getDoc(doc(db, "settings", "payment"));
    if (snap.exists()) stored = snap.data() as Partial<PaymentSettings>;
  } catch {}
  cached = { gateway: "razorpay", multiCurrencyEnabled: true, updatedAt: new Date().toISOString(), ...stored };
  cacheTime = Date.now();
  return cached;
}

export async function setPaymentGateway(gateway: PaymentGateway): Promise<void> {
  const current = cached ?? await getPaymentSettings();
  const data: PaymentSettings = { ...current, gateway, updatedAt: new Date().toISOString() };
  await setDoc(doc(db, "settings", "payment"), data, { merge: true });
  cached = data;
  cacheTime = Date.now();
}

export async function setMultiCurrencyEnabled(enabled: boolean): Promise<void> {
  const current = cached ?? await getPaymentSettings();
  const data: PaymentSettings = { ...current, multiCurrencyEnabled: enabled, updatedAt: new Date().toISOString() };
  await setDoc(doc(db, "settings", "payment"), data, { merge: true });
  cached = data;
  cacheTime = Date.now();
}
