import { describe, it, expect } from 'vitest';
import { PEARL_PACKS, planPurchase } from '../iap';
import { CATALOG } from '../catalog';

describe('iap', () => {
  it('has 4 ascending pearl packs with unique ids', () => {
    expect(PEARL_PACKS).toHaveLength(4);
    expect(new Set(PEARL_PACKS.map((p) => p.id)).size).toBe(4);
    const pearls = PEARL_PACKS.map((p) => p.pearls);
    expect([...pearls].sort((a, b) => a - b)).toEqual(pearls);   // already ascending
  });
  it('planPurchase: a pack grants its pearls and is consumable', () => {
    expect(planPurchase('pearls_medium')).toEqual({ grantPearls: 1300, consume: true });
  });
  it('planPurchase: a premium product unlocks its item and is NOT consumed', () => {
    expect(planPurchase('ui_sand')).toEqual({ unlockItem: 'ui.sand', consume: false });
  });
  it('planPurchase: unknown product id → null (ignored, not consumed)', () => {
    expect(planPurchase('totally_unknown')).toBeNull();
  });
  it('every premium product id maps back to a catalog item with that productId', () => {
    for (const item of CATALOG.filter((i) => i.productId)) {
      expect(planPurchase(item.productId!)).toEqual({ unlockItem: item.id, consume: false });
    }
  });
});
