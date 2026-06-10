import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the SDK wrapper BEFORE importing the controller. vi.hoisted defines the
// spy alongside the hoisted vi.mock so it isn't in the temporal dead zone.
const { getPayments } = vi.hoisted(() => ({ getPayments: vi.fn() }));
vi.mock('../../payments', () => ({ getPayments }));

import { reconcilePurchases, buyProduct } from '../purchasesController';
import { progressStore, resetProgress, isUnlocked } from '../progress';

beforeEach(() => { localStorage.clear(); resetProgress(); getPayments.mockReset(); });

describe('purchasesController', () => {
  it('reconcile grants + consumes an unprocessed pack, and restores a durable item (no consume)', async () => {
    const consumePurchase = vi.fn().mockResolvedValue(undefined);
    getPayments.mockReturnValue({
      getPurchases: vi.fn().mockResolvedValue([
        { productID: 'pearls_small', purchaseToken: 'tok-pack', developerPayload: '' },
        { productID: 'ui_sand',      purchaseToken: 'tok-item', developerPayload: '' },
      ]),
      consumePurchase,
    });
    await reconcilePurchases();
    expect(progressStore.get().pearls).toBe(500);     // pack granted
    expect(isUnlocked('ui.sand')).toBe(true);          // durable restored
    expect(consumePurchase).toHaveBeenCalledTimes(1);  // only the pack is consumed
    expect(consumePurchase).toHaveBeenCalledWith('tok-pack');
  });

  it('reconcile is a no-op when payments are unavailable', async () => {
    getPayments.mockReturnValue(null);
    await reconcilePurchases();
    expect(progressStore.get().pearls).toBe(0);
  });

  it('buyProduct(pack) grants pearls + consumes on success', async () => {
    const consumePurchase = vi.fn().mockResolvedValue(undefined);
    getPayments.mockReturnValue({
      purchase: vi.fn().mockResolvedValue({ productID: 'pearls_large', purchaseToken: 'tok', developerPayload: '' }),
      consumePurchase,
    });
    expect(await buyProduct('pearls_large')).toBe(true);
    expect(progressStore.get().pearls).toBe(3500);
    expect(consumePurchase).toHaveBeenCalledWith('tok');
  });

  it('buyProduct returns false when the purchase is cancelled/rejected', async () => {
    getPayments.mockReturnValue({
      purchase: vi.fn().mockRejectedValue(new Error('cancelled')),
      consumePurchase: vi.fn(),
    });
    expect(await buyProduct('pearls_large')).toBe(false);
    expect(progressStore.get().pearls).toBe(0);
  });

  it('buyProduct(single cosmetic) unlocks the item, no consume', async () => {
    const consumePurchase = vi.fn();
    getPayments.mockReturnValue({
      purchase: vi.fn().mockResolvedValue({ productID: 'back_onyx', purchaseToken: 'tok', developerPayload: '' }),
      consumePurchase,
    });
    expect(await buyProduct('back_onyx')).toBe(true);
    expect(isUnlocked('back.onyx')).toBe(true);
    expect(consumePurchase).not.toHaveBeenCalled();
  });

  it('buyProduct(bundle) grants all items + bonus pearls and consumes', async () => {
    const consumePurchase = vi.fn().mockResolvedValue(undefined);
    getPayments.mockReturnValue({
      purchase: vi.fn().mockResolvedValue({ productID: 'bundle_founder', purchaseToken: 'tok', developerPayload: '' }),
      consumePurchase,
    });
    expect(await buyProduct('bundle_founder')).toBe(true);
    expect(isUnlocked('ui.aurora')).toBe(true);
    expect(isUnlocked('back.prism')).toBe(true);
    expect(progressStore.get().pearls).toBe(1500);
    expect(consumePurchase).toHaveBeenCalledWith('tok');
  });

  it('does NOT double-credit a pack when consume fails and reconcile re-sees it (idempotency ledger)', async () => {
    getPayments.mockReturnValue({
      purchase: vi.fn().mockResolvedValue({ productID: 'pearls_large', purchaseToken: 'tok', developerPayload: '' }),
      getPurchases: vi.fn().mockResolvedValue([{ productID: 'pearls_large', purchaseToken: 'tok', developerPayload: '' }]),
      consumePurchase: vi.fn().mockRejectedValue(new Error('consume failed')),
    });
    expect(await buyProduct('pearls_large')).toBe(true);
    expect(progressStore.get().pearls).toBe(3500);            // credited once
    await reconcilePurchases();                                // re-sees the still-unconsumed purchase
    expect(progressStore.get().pearls).toBe(3500);            // NOT 7000 — ledger blocks the re-credit
    expect(progressStore.get().processedPurchases).toContain('tok');
  });

  it('prunes the ledger token once a pack is successfully consumed', async () => {
    getPayments.mockReturnValue({
      purchase: vi.fn().mockResolvedValue({ productID: 'pearls_small', purchaseToken: 't', developerPayload: '' }),
      consumePurchase: vi.fn().mockResolvedValue(undefined),
    });
    expect(await buyProduct('pearls_small')).toBe(true);
    expect(progressStore.get().pearls).toBe(500);
    expect(progressStore.get().processedPurchases).toEqual([]);  // pruned after consume succeeds
  });
});
