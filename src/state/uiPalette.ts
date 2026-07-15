import { ITEM_BY_ID } from './catalog';

const COLOR_KEYS = ['navy','navy-soft','blue','blue-mid','white','text-muted','gold','gold-border','coral'] as const;

// expects #rrggbb — catalog palette values are validated 6-digit hex
function hexToTriplet(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function rgb01(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
}
/** Hue angle (0–360°) of a hex color. */
function hexToHue(hex: string): number {
  const [r, g, b] = rgb01(hex);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return 0;
  let hue = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  hue *= 60;
  return hue < 0 ? hue + 360 : hue;
}
/** HSL saturation (0–1) of a hex color. */
function hexToSat(hex: string): number {
  const [r, g, b] = rgb01(hex);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return 0;
  const l = (max + min) / 2;
  return d / (1 - Math.abs(2 * l - 1));
}

// The ornate title-plaque image (title-bg.webp) can't read a CSS var — it's tinted with a
// hue-rotate + saturate filter. Hue shifts it toward the palette's hue; saturation
// scales toward the palette's (so a desaturated palette like Graphite greys the logo,
// which a pure hue-rotate — same hue as the default — would miss). 0°/1× = unchanged.
const DEFAULT_BLUE_HUE = hexToHue('#0d47a1');
const DEFAULT_BLUE_SAT = hexToSat('#0d47a1');

/** Apply a UI-palette item's color overrides to :root custom props. Unset keys fall back to _tokens defaults. */
export function applyUiPalette(id: string): void {
  const item = ITEM_BY_ID[id];
  const palette = item?.palette ?? {};
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
  // Tint the logo image toward the palette (default palette → cleared → 0°/1×).
  if (palette.blue) {
    root.setProperty('--logo-hue', `${Math.round(hexToHue(palette.blue) - DEFAULT_BLUE_HUE)}deg`);
    const sat = Math.max(0.35, Math.min(1.5, hexToSat(palette.blue) / DEFAULT_BLUE_SAT));
    root.setProperty('--logo-sat', sat.toFixed(2));
  } else {
    root.removeProperty('--logo-hue');
    root.removeProperty('--logo-sat');
  }
  // Only money-purchasable palettes (those with an IAP productId) earn the premium
  // shimmer on the logo + mode buttons — pearl-only and the free default do not.
  document.documentElement.classList.toggle('palette-premium', !!item?.productId);
}
