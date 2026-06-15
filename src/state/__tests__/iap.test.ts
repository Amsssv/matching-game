import { describe, it, expect } from 'vitest';
import { PEARL_PACKS, BUNDLES, planPurchase } from '../iap';
import { CATALOG } from '../catalog';

describe('iap', () => {
  it('has 4 ascending pearl packs with unique ids', () => {
    expect(PEARL_PACKS).toHaveLength(4);
    expect(new Set(PEARL_PACKS.map((p) => p.id)).size).toBe(4);
    const pearls = PEARL_PACKS.map((p) => p.pearls);
    expect([...pearls].sort((a, b) => a - b)).toEqual(pearls);
  });
  it('planPurchase: a pack grants its pearls and is consumable', () => {
    expect(planPurchase('pearls_medium')).toEqual({ grantPearls: 1500, consume: true });
  });
  it('planPurchase: a single product unlocks one item and is NOT consumed', () => {
    expect(planPurchase('ui_sand')).toEqual({ unlockItems: ['ui.sand'], consume: false });
  });
  it('planPurchase: an exclusive item unlocks itself, not consumed', () => {
    expect(planPurchase('ui_aurora')).toEqual({ unlockItems: ['ui.aurora'], consume: false });
  });
  it('planPurchase: a bundle grants its items + bonus pearls and IS consumed', () => {
    expect(planPurchase('bundle_founder')).toEqual({ grantPearls: 1500, unlockItems: ['back.jade', 'ui.crimson'], consume: true });
  });
  it('planPurchase: unknown product id → null', () => {
    expect(planPurchase('totally_unknown')).toBeNull();
  });
  it('every bundle references real catalog item ids', () => {
    const ids = new Set(CATALOG.map((i) => i.id));
    for (const b of BUNDLES) for (const id of b.items) expect(ids.has(id), `${b.id} → ${id}`).toBe(true);
  });
});
