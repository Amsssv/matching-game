import { getPayments } from '../payments';
import { awardPearls, grantItem } from './progress';
import { planPurchase } from './iap';
import { ITEM_BY_ID } from './catalog';
import { setModal } from './store';

const SIMULATE = import.meta.env.DEV;   // dev: simulate purchases when the Payments SDK is absent

export function openTopup(): void { setModal({ topup: true }); }
export function closeTopup(): void { setModal({ topup: false }); }

/** Apply one purchase: grant pearls and/or unlock an item, then consume if it's a consumable. */
async function processPurchase(p: YandexPurchase, pay: YandexPayments): Promise<void> {
  const plan = planPurchase(p.productID);
  if (!plan) return;                                   // unknown product → leave untouched
  if (plan.grantPearls) awardPearls(plan.grantPearls);
  if (plan.unlockItem) grantItem(plan.unlockItem);
  if (plan.consume) { try { await pay.consumePurchase(p.purchaseToken); } catch { /* reconcile retries next launch */ } }
}

/** Buy a pearl pack. Returns pearls granted, or null on cancel/failure. */
export async function buyPack(productId: string): Promise<number | null> {
  const plan = planPurchase(productId);
  if (!plan?.grantPearls) return null;
  const pay = getPayments();
  if (!pay) {                                          // no SDK
    if (!SIMULATE) return null;
    awardPearls(plan.grantPearls);                     // dev simulation
    return plan.grantPearls;
  }
  try {
    const res = await pay.purchase({ id: productId });
    await processPurchase(res, pay);
    return plan.grantPearls;
  } catch {
    return null;                                       // user cancelled / failed
  }
}

/** Buy a premium cosmetic for money. Returns true if unlocked. */
export async function buyItemForMoney(itemId: string): Promise<boolean> {
  const item = ITEM_BY_ID[itemId];
  if (!item?.productId) return false;
  const pay = getPayments();
  if (!pay) {
    if (!SIMULATE) return false;
    return grantItem(itemId);                          // dev simulation
  }
  try {
    const res = await pay.purchase({ id: item.productId });
    await processPurchase(res, pay);
    return true;
  } catch {
    return false;
  }
}

/** MANDATORY for moderation: on load, process/consume any unprocessed purchases + restore durables. */
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
