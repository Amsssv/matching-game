import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the SDK wrapper BEFORE importing the controller. vi.hoisted defines the
// spy alongside the hoisted vi.mock so it isn't in the temporal dead zone.
const { getPayments } = vi.hoisted(() => ({ getPayments: vi.fn() }));
vi.mock('../../payments', () => ({ getPayments }));

import { reconcilePurchases, buyPack, buyItemForMoney } from '../purchasesController';
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

  it('buyPack grants pearls + consumes on success', async () => {
    const consumePurchase = vi.fn().mockResolvedValue(undefined);
    getPayments.mockReturnValue({
      purchase: vi.fn().mockResolvedValue({ productID: 'pearls_large', purchaseToken: 'tok', developerPayload: '' }),
      consumePurchase,
    });
    const granted = await buyPack('pearls_large');
    expect(granted).toBe(3500);
    expect(progressStore.get().pearls).toBe(3500);
    expect(consumePurchase).toHaveBeenCalledWith('tok');
  });

  it('buyPack returns null when the purchase is cancelled/rejected', async () => {
    getPayments.mockReturnValue({
      purchase: vi.fn().mockRejectedValue(new Error('cancelled')),
      consumePurchase: vi.fn(),
    });
    const granted = await buyPack('pearls_large');
    expect(granted).toBeNull();
    expect(progressStore.get().pearls).toBe(0);
  });

  it('buyItemForMoney unlocks the premium item on success (no consume)', async () => {
    const consumePurchase = vi.fn();
    getPayments.mockReturnValue({
      purchase: vi.fn().mockResolvedValue({ productID: 'back_onyx', purchaseToken: 'tok', developerPayload: '' }),
      consumePurchase,
    });
    const ok = await buyItemForMoney('back.onyx');
    expect(ok).toBe(true);
    expect(isUnlocked('back.onyx')).toBe(true);
    expect(consumePurchase).not.toHaveBeenCalled();
  });
});
