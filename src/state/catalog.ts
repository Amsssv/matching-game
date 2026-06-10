export type CustomAxis = 'seaTheme' | 'cardBack' | 'uiPalette';

export interface ShopItem {
  id: string;
  axis: CustomAxis;
  nameKey: string;          // i18n key in LOCALES.shopItems
  price: number;            // 0 = default (free, always unlocked)
  tint?: number;            // seaTheme/cardBack: Phaser tint (0xRRGGBB)
  palette?: Record<string, string>;  // uiPalette: { 'navy': '#..', 'blue': '#..', ... } (token name → hex)
  productId?: string;       // Yandex Payments product id — set only on items buyable for real money
  exclusive?: boolean;      // money-only: never auto-unlocked, never shows a pearl price
}

export const CATALOG: ShopItem[] = [
  // sea (tint bg + island)
  { id: 'sea.lagoon', axis: 'seaTheme', nameKey: 'seaLagoon', price: 0,   tint: 0xffffff },
  { id: 'sea.reef',   axis: 'seaTheme', nameKey: 'seaReef',   price: 80,  tint: 0xffd9b0 },
  { id: 'sea.abyss',  axis: 'seaTheme', nameKey: 'seaAbyss',  price: 300, tint: 0x6878a8 },
  { id: 'sea.arctic', axis: 'seaTheme', nameKey: 'seaArctic', price: 200, tint: 0xbfe8ff },
  { id: 'sea.tropic', axis: 'seaTheme', nameKey: 'seaTropic', price: 150, tint: 0xaef0d0 },
  { id: 'sea.dusk',   axis: 'seaTheme', nameKey: 'seaDusk',   price: 450, tint: 0x9a86c8 },
  { id: 'sea.ember',  axis: 'seaTheme', nameKey: 'seaEmber',  price: 600, tint: 0xffb38a, productId: 'sea_ember' },
  // card-back (tint card-back image)
  { id: 'back.classic', axis: 'cardBack', nameKey: 'backClassic', price: 0,   tint: 0xffffff },
  { id: 'back.gold',    axis: 'cardBack', nameKey: 'backGold',    price: 100, tint: 0xf7d077 },
  { id: 'back.coral',   axis: 'cardBack', nameKey: 'backCoral',   price: 180, tint: 0xff8a80 },
  { id: 'back.deep',    axis: 'cardBack', nameKey: 'backDeep',    price: 350, tint: 0x4a6aa8 },
  { id: 'back.silver',  axis: 'cardBack', nameKey: 'backSilver',  price: 70,  tint: 0xd8dee8 },
  { id: 'back.jade',    axis: 'cardBack', nameKey: 'backJade',    price: 250, tint: 0x7fd4a8 },
  { id: 'back.onyx',    axis: 'cardBack', nameKey: 'backOnyx',    price: 500, tint: 0x3a3f4a, productId: 'back_onyx' },
  // ui palette (token name → hex; default 'ui.ocean' = empty → fall back to _tokens defaults)
  { id: 'ui.ocean',    axis: 'uiPalette', nameKey: 'uiOcean',    price: 0,   palette: {} },
  { id: 'ui.sunset',   axis: 'uiPalette', nameKey: 'uiSunset',   price: 150,
    palette: { 'navy': '#2b1a2e', 'navy-soft': '#3d2436', 'blue': '#b5532e', 'blue-mid': '#e0703c', 'gold': '#ffd27a', 'gold-border': '#e8a24d', 'text-muted': '#e8c4b0' } },
  { id: 'ui.emerald',  axis: 'uiPalette', nameKey: 'uiEmerald',  price: 550,
    palette: { 'navy': '#04241c', 'navy-soft': '#073a2c', 'blue': '#0e7a55', 'blue-mid': '#16a06f', 'gold': '#cfe87a', 'gold-border': '#9fc24d', 'text-muted': '#b8dcc8' } },
  { id: 'ui.amethyst', axis: 'uiPalette', nameKey: 'uiAmethyst', price: 700,
    palette: { 'navy': '#1a1430', 'navy-soft': '#241a44', 'blue': '#5a3da1', 'blue-mid': '#7d56c0', 'gold': '#e0c0ff', 'gold-border': '#b88ad4', 'text-muted': '#cdc0e8' }, productId: 'ui_amethyst' },
  { id: 'ui.crimson', axis: 'uiPalette', nameKey: 'uiCrimson', price: 300,
    palette: { 'navy': '#2a0e14', 'navy-soft': '#3d1620', 'blue': '#a32638', 'blue-mid': '#cf3a4e', 'gold': '#ffcf8a', 'gold-border': '#e8a24d', 'text-muted': '#e8b8b8' } },
  { id: 'ui.slate',   axis: 'uiPalette', nameKey: 'uiSlate',   price: 400,
    palette: { 'navy': '#141a22', 'navy-soft': '#1f2832', 'blue': '#3d566e', 'blue-mid': '#5878a0', 'gold': '#cdd8e8', 'gold-border': '#8aa0bc', 'text-muted': '#b0bccc' } },
  { id: 'ui.sand',    axis: 'uiPalette', nameKey: 'uiSand',    price: 900,
    palette: { 'navy': '#2a2114', 'navy-soft': '#3d3020', 'blue': '#b07a32', 'blue-mid': '#d8a24e', 'gold': '#ffe6a8', 'gold-border': '#e8c878', 'text-muted': '#e0d2b0' }, productId: 'ui_sand' },
  // exclusive (money-only — shown in the ✨ tab, bought via Yandex Payments)
  { id: 'ui.aurora', axis: 'uiPalette', nameKey: 'uiAurora', price: 0, exclusive: true, productId: 'ui_aurora',
    palette: { 'navy': '#0a1f2e', 'navy-soft': '#103040', 'blue': '#1aa3a3', 'blue-mid': '#3ad6c0', 'gold': '#c8a0ff', 'gold-border': '#9d6ee0', 'text-muted': '#bfe8e0' } },
  { id: 'back.prism', axis: 'cardBack', nameKey: 'backPrism', price: 0, exclusive: true, productId: 'back_prism', tint: 0xc0b0ff },
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
