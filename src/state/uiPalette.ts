import { ITEM_BY_ID } from './catalog';

const COLOR_KEYS = ['navy','navy-soft','blue','blue-mid','white','text-muted','gold','gold-border','coral'] as const;

// expects #rrggbb — catalog palette values are validated 6-digit hex
function hexToTriplet(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/** Apply a UI-palette item's color overrides to :root custom props. Unset keys fall back to _tokens defaults. */
export function applyUiPalette(id: string): void {
  const palette = ITEM_BY_ID[id]?.palette ?? {};
  const root = document.documentElement.style;
  for (const key of COLOR_KEYS) {
    const hex = palette[key];
    if (hex) {
      root.setProperty(`--color-${key}`, hex);
      root.setProperty(`--color-${key}-rgb`, hexToTriplet(hex));
    } else {
      root.removeProperty(`--color-${key}`);
      root.removeProperty(`--color-${key}-rgb`);
    }
  }
}
