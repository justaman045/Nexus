import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

export type PaymentGateway = "razorpay" | "stripe";

export interface PaymentSettings {
  gateway: PaymentGateway;
  multiCurrencyEnabled: boolean;
  updatedAt: string;
}

let cached: PaymentSettings | null = null;
let cacheTime = 0;
const TTL = 30 * 1000; // 30 seconds — short so switching takes effect quickly

export function clearPaymentSettingsCache(): void {
  cached = null;
  cacheTime = 0;
}

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

async function savePaymentSettings(data: Record<string, unknown>): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated. Please sign in.");
  const idToken = await user.getIdToken();

  const res = await fetch("/api/settings/payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(error.error || "Failed to update payment settings");
  }
}

export async function setPaymentGateway(gateway: PaymentGateway): Promise<void> {
  await savePaymentSettings({ gateway });
  const current = cached ?? (await getPaymentSettings());
  cached = { ...current, gateway, updatedAt: new Date().toISOString() };
  cacheTime = Date.now();
}

export async function setMultiCurrencyEnabled(enabled: boolean): Promise<void> {
  await savePaymentSettings({ multiCurrencyEnabled: enabled });
  const current = cached ?? (await getPaymentSettings());
  cached = { ...current, multiCurrencyEnabled: enabled, updatedAt: new Date().toISOString() };
  cacheTime = Date.now();
}
