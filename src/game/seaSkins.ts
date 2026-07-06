/**
 * Real per-theme sea skin art (background + island), keyed by the `seaTheme`
 * catalog item id. Replaces the old single-texture + Phaser-tint approach.
 * The default 'sea.lagoon' reuses the legacy texture keys so code that
 * references 'bg'/'island'/'island-mobile' by default keeps working.
 */
export interface SeaSkin {
  bgKey: string;            bgPath: string;
  islandKey: string;        islandPath: string;
  islandMobileKey: string;  islandMobilePath: string;
}

export const SEA_SKINS: Record<string, SeaSkin> = {
  'sea.lagoon': {
    bgKey: 'bg',                 bgPath: 'assets/bg.webp',
    islandKey: 'island',         islandPath: 'assets/iland.webp',
    islandMobileKey: 'island-mobile', islandMobilePath: 'assets/iland-mobile.webp',
  },
  'sea.reef': {
    bgKey: 'sea-reef-bg',        bgPath: 'assets/skins/Reef/Reef-bg.webp',
    islandKey: 'sea-reef-island', islandPath: 'assets/skins/Reef/Reef-iland.webp',
    islandMobileKey: 'sea-reef-island-mobile', islandMobilePath: 'assets/skins/Reef/Reef-iland-mobile.webp',
  },
  'sea.arctic': {
    bgKey: 'sea-arctic-bg',      bgPath: 'assets/skins/Arctic/Arctic-bg.webp',
    islandKey: 'sea-arctic-island', islandPath: 'assets/skins/Arctic/Arctic-iland.webp',
    islandMobileKey: 'sea-arctic-island-mobile', islandMobilePath: 'assets/skins/Arctic/Arctic-iland-mobile.webp',
  },
  'sea.abyss': {
    bgKey: 'sea-abyss-bg',       bgPath: 'assets/skins/Abyss/Abyss-bg.webp',
    islandKey: 'sea-abyss-island', islandPath: 'assets/skins/Abyss/Abyss-iland.webp',
    islandMobileKey: 'sea-abyss-island-mobile', islandMobilePath: 'assets/skins/Abyss/Abyss-iland-mobile.webp',
  },
  'sea.lava': {
    bgKey: 'sea-lava-bg',        bgPath: 'assets/skins/Lava/Lava-bg.webp',
    islandKey: 'sea-lava-island', islandPath: 'assets/skins/Lava/Lava-iland.webp',
    islandMobileKey: 'sea-lava-island-mobile', islandMobilePath: 'assets/skins/Lava/Lava-iland-mobile.webp',
  },
};

/** Equipped skin for a seaTheme id, falling back to the default lagoon. */
export const skinFor = (id: string): SeaSkin => SEA_SKINS[id] ?? SEA_SKINS['sea.lagoon'];
