import { getYSDK } from './ysdk';

let payments: YandexPayments | null = null;

/** Fetch the Payments object once, after initYSDK(). No-op (payments stays null) when unavailable. */
export async function initPayments(): Promise<void> {
  const sdk = getYSDK();
  if (!sdk?.getPayments) return;
  try {
    payments = await sdk.getPayments({ signed: false });
  } catch {
    payments = null;          // purchases unavailable in this environment (guest / non-Yandex)
  }
}

export function getPayments(): YandexPayments | null {
  return payments;
}

/** Whether to show money UI: a Payments environment exists (Yandex host), or we're in dev (simulation). */
export function paymentsAvailable(): boolean {
  return payments != null || import.meta.env.DEV;
}

/** productId → display price string (e.g. "100 YAN"). Empty object when payments are unavailable. */
export async function loadCatalogPrices(): Promise<Record<string, string>> {
  if (!payments) return {};
  try {
    const products = await payments.getCatalog();
    return Object.fromEntries(products.map((p) => [p.id, p.price]));
  } catch {
    return {};
  }
}
