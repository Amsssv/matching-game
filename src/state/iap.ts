import { CATALOG } from './catalog';

export interface PearlPack { id: string; pearls: number; }

/** Consumable pearl packs. `id` must match the product id in the Yandex Developer Console. */
export const PEARL_PACKS: PearlPack[] = [
  { id: 'pearls_small',  pearls: 500 },
  { id: 'pearls_medium', pearls: 1500 },
  { id: 'pearls_large',  pearls: 4000 },
  { id: 'pearls_mega',   pearls: 8000 },
];

export interface Bundle { id: string; nameKey: string; items: string[]; pearls: number; }

/** Money-only bundles. `id` = console product id (consumable, since they grant pearls). */
export const BUNDLES: Bundle[] = [
  // Founder pack: a card-back + a UI palette + bonus pearls.
  { id: 'bundle_founder', nameKey: 'bundleFounder', items: ['back.jade', 'ui.crimson'], pearls: 1500 },
  // No sea skins in bundles — sea themes are sold individually (pearls or money).
  { id: 'bundle_premium', nameKey: 'bundlePremium', items: ['back.onyx', 'ui.amethyst', 'ui.sand'], pearls: 1000 },
];

const PACK_PEARLS_BY_ID: Record<string, number> =
  Object.fromEntries(PEARL_PACKS.map((p) => [p.id, p.pearls]));
const ITEM_ID_BY_PRODUCT: Record<string, string> =
  Object.fromEntries(CATALOG.filter((i) => i.productId).map((i) => [i.productId!, i.id]));
const BUNDLE_BY_ID: Record<string, Bundle> =
  Object.fromEntries(BUNDLES.map((b) => [b.id, b]));

export interface PurchasePlan {
  grantPearls?: number;     // credit this many pearls
  unlockItems?: string[];   // unlock these catalog item ids
  consume: boolean;         // consumable iff it grants pearls (currency); pure cosmetics are durable
}

/** Pure decision: given a Yandex product id, what should the game grant? null = unknown → ignore. */
export function planPurchase(productId: string): PurchasePlan | null {
  const pearls = PACK_PEARLS_BY_ID[productId];
  if (pearls != null) return { grantPearls: pearls, consume: true };
  const itemId = ITEM_ID_BY_PRODUCT[productId];
  if (itemId) return { unlockItems: [itemId], consume: false };
  const bundle = BUNDLE_BY_ID[productId];
  if (bundle) return { grantPearls: bundle.pearls, unlockItems: bundle.items, consume: true };
  return null;
}
