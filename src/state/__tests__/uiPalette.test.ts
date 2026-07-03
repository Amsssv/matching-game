import { describe, it, expect, beforeEach } from 'vitest';
import { applyUiPalette } from '../uiPalette';

describe('applyUiPalette', () => {
  beforeEach(() => { document.documentElement.removeAttribute('style'); document.documentElement.classList.remove('palette-premium'); });
  it('sets --color-* and --color-*-rgb for a palette', () => {
    applyUiPalette('ui.sunset');
    const s = document.documentElement.style;
    expect(s.getPropertyValue('--color-blue').trim()).toBe('#b5532e');
    expect(s.getPropertyValue('--color-blue-rgb').trim()).toBe('181 83 46');
  });
  it('default palette clears overrides (falls back to token defaults)', () => {
    applyUiPalette('ui.sunset');
    applyUiPalette('ui.ocean');   // palette {} → removeProperty
    expect(document.documentElement.style.getPropertyValue('--color-blue')).toBe('');
  });
  it('unknown id is a safe no-op (clears overrides)', () => {
    applyUiPalette('ui.sunset');
    applyUiPalette('does.not.exist');
    expect(document.documentElement.style.getPropertyValue('--color-blue')).toBe('');
  });
  it('toggles palette-premium only for money-purchasable palettes (productId)', () => {
    const has = () => document.documentElement.classList.contains('palette-premium');
    applyUiPalette('ui.amethyst');  // has productId → money → shimmer
    expect(has()).toBe(true);
    applyUiPalette('ui.sunset');    // pearls-only (no productId) → no shimmer
    expect(has()).toBe(false);
    applyUiPalette('ui.aurora');    // money-only (exclusive + productId) → shimmer
    expect(has()).toBe(true);
    applyUiPalette('ui.ocean');     // free default → no shimmer
    expect(has()).toBe(false);
  });
  it('sets --logo-hue from the palette blue hue and clears it on the default palette', () => {
    const root = document.documentElement.style;
    applyUiPalette('ui.sunset');                       // blue #b5532e (orange hue) → large rotation
    const deg = root.getPropertyValue('--logo-hue').trim();
    expect(deg).toMatch(/^-?\d+deg$/);
    expect(deg).not.toBe('0deg');
    applyUiPalette('ui.ocean');                        // palette {} → no blue → cleared
    expect(root.getPropertyValue('--logo-hue')).toBe('');
  });
  it('a partial palette sets its own keys and clears the ones it omits', () => {
    const root = document.documentElement.style;
    root.setProperty('--color-white', '#000000');   // pretend a prior palette had set white
    root.setProperty('--color-white-rgb', '0 0 0');
    applyUiPalette('ui.sunset');                     // sunset sets gold etc. but omits white + coral
    expect(root.getPropertyValue('--color-gold').trim()).toBe('#ffd27a');       // present → set
    expect(root.getPropertyValue('--color-gold-rgb').trim()).toBe('255 210 122');
    expect(root.getPropertyValue('--color-white')).toBe('');                     // omitted → cleared
    expect(root.getPropertyValue('--color-white-rgb')).toBe('');
  });
});
