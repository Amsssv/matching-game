export type CustomAxis = 'seaTheme' | 'cardBack' | 'uiPalette';

export interface ShopItem {
  id: string;
  axis: CustomAxis;
  nameKey: string;          // i18n key in LOCALES.shopItems
  price: number;            // 0 = default (free, always unlocked)
  tint?: number;            // seaTheme/cardBack: Phaser tint (0xRRGGBB)
  palette?: Record<string, string>;  // uiPalette: { 'navy': '#..', 'blue': '#..', ... } (token name → hex)
}

export const CATALOG: ShopItem[] = [
  // sea (tint bg + island)
  { id: 'sea.lagoon', axis: 'seaTheme', nameKey: 'seaLagoon', price: 0,   tint: 0xffffff },
  { id: 'sea.reef',   axis: 'seaTheme', nameKey: 'seaReef',   price: 80,  tint: 0xffd9b0 },
  { id: 'sea.abyss',  axis: 'seaTheme', nameKey: 'seaAbyss',  price: 120, tint: 0x6878a8 },
  { id: 'sea.arctic', axis: 'seaTheme', nameKey: 'seaArctic', price: 120, tint: 0xbfe8ff },
  // card-back (tint card-back image)
  { id: 'back.classic', axis: 'cardBack', nameKey: 'backClassic', price: 0,   tint: 0xffffff },
  { id: 'back.gold',    axis: 'cardBack', nameKey: 'backGold',    price: 60,  tint: 0xf7d077 },
  { id: 'back.coral',   axis: 'cardBack', nameKey: 'backCoral',   price: 80,  tint: 0xff8a80 },
  { id: 'back.deep',    axis: 'cardBack', nameKey: 'backDeep',    price: 100, tint: 0x4a6aa8 },
  // ui palette (token name → hex; default 'ui.ocean' = empty → fall back to _tokens defaults)
  { id: 'ui.ocean',    axis: 'uiPalette', nameKey: 'uiOcean',    price: 0,   palette: {} },
  { id: 'ui.sunset',   axis: 'uiPalette', nameKey: 'uiSunset',   price: 100,
    palette: { 'navy': '#2b1a2e', 'navy-soft': '#3d2436', 'blue': '#b5532e', 'blue-mid': '#e0703c', 'gold': '#ffd27a', 'gold-border': '#e8a24d', 'text-muted': '#e8c4b0' } },
  { id: 'ui.emerald',  axis: 'uiPalette', nameKey: 'uiEmerald',  price: 150,
    palette: { 'navy': '#04241c', 'navy-soft': '#073a2c', 'blue': '#0e7a55', 'blue-mid': '#16a06f', 'gold': '#cfe87a', 'gold-border': '#9fc24d', 'text-muted': '#b8dcc8' } },
  { id: 'ui.amethyst', axis: 'uiPalette', nameKey: 'uiAmethyst', price: 150,
    palette: { 'navy': '#1a1430', 'navy-soft': '#241a44', 'blue': '#5a3da1', 'blue-mid': '#7d56c0', 'gold': '#e0c0ff', 'gold-border': '#b88ad4', 'text-muted': '#cdc0e8' } },
];

export const DEFAULT_EQUIPPED: Record<CustomAxis, string> = {
  seaTheme: 'sea.lagoon', cardBack: 'back.classic', uiPalette: 'ui.ocean',
};

export const AXES = Object.keys(DEFAULT_EQUIPPED) as CustomAxis[];

export const ITEM_BY_ID: Record<string, ShopItem> =
  Object.fromEntries(CATALOG.map((i) => [i.id, i]));

/** Neutral Phaser tint — applied when an item has no tint (the default cosmetics). */
export const NO_TINT = 0xffffff;

/** Phaser tint for an equipped item id, falling back to NO_TINT for unknown/tint-less items. */
export const tintOf = (id: string): number => ITEM_BY_ID[id]?.tint ?? NO_TINT;
