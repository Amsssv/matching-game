import { describe, it, expect, beforeEach, vi } from 'vitest';
import { equip } from '../shopController';
import { awardPearls, buyItem, resetProgress, progressStore } from '../progress';
import { bus } from '../eventBus';

describe('shopController.equip routing', () => {
  beforeEach(() => { localStorage.clear(); resetProgress(); document.documentElement.removeAttribute('style'); });

  it('equipping a uiPalette applies CSS custom props (no bus emit)', () => {
    const spy = vi.fn();
    const off = bus.on('cmd:equip-changed', spy);
    awardPearls(200); buyItem('ui.sunset');
    equip('uiPalette', 'ui.sunset');
    expect(document.documentElement.style.getPropertyValue('--color-blue').trim()).toBe('#b5532e');
    expect(spy).not.toHaveBeenCalled();
    off();
  });

  it('equipping a seaTheme emits cmd:equip-changed (no palette change)', () => {
    const spy = vi.fn();
    const off = bus.on('cmd:equip-changed', spy);
    equip('seaTheme', 'sea.lagoon');   // default item, always unlocked
    expect(spy).toHaveBeenCalledTimes(1);
    expect(document.documentElement.style.getPropertyValue('--color-blue')).toBe('');
    off();
  });

  it('equipping a LOCKED item is a full no-op (no state change, no side-effect)', () => {
    const spy = vi.fn();
    const off = bus.on('cmd:equip-changed', spy);
    equip('uiPalette', 'ui.sunset');   // never bought → locked
    expect(progressStore.get().equipped.uiPalette).toBe('ui.ocean');   // unchanged default
    expect(document.documentElement.style.getPropertyValue('--color-blue')).toBe('');  // no palette applied
    equip('seaTheme', 'sea.reef');     // never bought → locked
    expect(progressStore.get().equipped.seaTheme).toBe('sea.lagoon');  // unchanged default
    expect(spy).not.toHaveBeenCalled();   // no canvas re-tint emitted
    off();
  });
});
