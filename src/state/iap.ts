import { CATALOG } from './catalog';

export interface PearlPack { id: string; pearls: number; }

/** Consumable pearl packs. `id` must match the product id in the Yandex Developer Console. */
export const PEARL_PACKS: PearlPack[] = [
  { id: 'pearls_small',  pearls: 500 },
  { id: 'pearls_medium', pearls: 1300 },
  { id: 'pearls_large',  pearls: 3500 },
  { id: 'pearls_mega',   pearls: 8000 },
];

const PACK_PEARLS_BY_ID: Record<string, number> =
  Object.fromEntries(PEARL_PACKS.map((p) => [p.id, p.pearls]));

const ITEM_ID_BY_PRODUCT: Record<string, string> =
  Object.fromEntries(CATALOG.filter((i) => i.productId).map((i) => [i.productId!, i.id]));

export interface PurchasePlan {
  grantPearls?: number;   // credit this many pearls
  unlockItem?: string;    // unlock this catalog item id
  consume: boolean;       // consumables (packs) must be consumed; durables (items) must not
}

/** Pure decision: given a Yandex product id, what should the game grant? null = unknown → ignore. */
export function planPurchase(productId: string): PurchasePlan | null {
  const pearls = PACK_PEARLS_BY_ID[productId];
  if (pearls != null) return { grantPearls: pearls, consume: true };
  const itemId = ITEM_ID_BY_PRODUCT[productId];
  if (itemId) return { unlockItem: itemId, consume: false };
  return null;
}
