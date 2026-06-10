import { getPayments } from '../payments';
import { awardPearls, grantItem } from './progress';
import { planPurchase, type PurchasePlan } from './iap';
import { setModal } from './store';

const SIMULATE = import.meta.env.DEV;   // dev: simulate purchases when the Payments SDK is absent

export function openStore(): void { setModal({ store: true }); }
export function closeStore(): void { setModal({ store: false }); }

/** Grant a plan's pearls + items (idempotent for items). */
function applyPlan(plan: PurchasePlan): void {
  if (plan.grantPearls) awardPearls(plan.grantPearls);
  plan.unlockItems?.forEach((id) => grantItem(id));
}

/** Apply a purchase, then consume it if it's a consumable. */
async function processPurchase(p: YandexPurchase, pay: YandexPayments): Promise<void> {
  const plan = planPurchase(p.productID);
  if (!plan) return;                                   // unknown product → leave untouched
  applyPlan(plan);
  if (plan.consume) { try { await pay.consumePurchase(p.purchaseToken); } catch { /* reconcile retries */ } }
}

/** Buy any product (pack / single cosmetic / bundle) by its Yandex product id. Returns true on success. */
export async function buyProduct(productId: string): Promise<boolean> {
  const plan = planPurchase(productId);
  if (!plan) return false;
  const pay = getPayments();
  if (!pay) {                                          // no SDK
    if (!SIMULATE) return false;
    applyPlan(plan);                                   // dev simulation
    return true;
  }
  try {
    const res = await pay.purchase({ id: productId });
    await processPurchase(res, pay);
    return true;
  } catch {
    return false;                                      // user cancelled / failed
  }
}

/** MANDATORY for moderation: on load, process/consume unprocessed purchases + restore durables. */
export async function reconcilePurchases(): Promise<void> {
  const pay = getPayments();
  if (!pay) return;
  try {
    const purchases = await pay.getPurchases();
    for (const p of purchases) await processPurchase(p, pay);
  } catch {
    /* PAYMENT_FAILURE / offline — retry on next launch */
  }
}
