/**
 * Real per-theme sea skin art (background + island), keyed by the `seaTheme`
 * catalog item id. Replaces the old single-texture + Phaser-tint approach.
 * The default 'sea.lagoon' now uses its own 'sea-lagoon-*' keys like every other skin.
 */
export interface SeaSkin {
  bgKey: string;            bgPath: string;
  /** Portrait-authored background, only fetched + used on phones/tablets.
   *  Optional: skins without portrait art (lagoon, lava) fall back to `bg`. */
  bgMobileKey?: string;     bgMobilePath?: string;
  islandKey: string;        islandPath: string;
  islandMobileKey: string;  islandMobilePath: string;
}

export const SEA_SKINS: Record<string, SeaSkin> = {
  'sea.lagoon': {
    bgKey: 'sea-lagoon-bg',              bgPath: 'assets/skins/Lagoon/Lagoon-bg.webp',
    islandKey: 'sea-lagoon-island',      islandPath: 'assets/skins/Lagoon/Lagoon-iland.webp',
    islandMobileKey: 'sea-lagoon-island-mobile', islandMobilePath: 'assets/skins/Lagoon/Lagoon-iland-mobile.webp',
  },
  'sea.reef': {
    bgKey: 'sea-reef-bg',        bgPath: 'assets/skins/Reef/Reef-bg.webp',
    bgMobileKey: 'sea-reef-bg-mobile', bgMobilePath: 'assets/skins/Reef/Reef-bg-mobile.webp',
    islandKey: 'sea-reef-island', islandPath: 'assets/skins/Reef/Reef-iland.webp',
    islandMobileKey: 'sea-reef-island-mobile', islandMobilePath: 'assets/skins/Reef/Reef-iland-mobile.webp',
  },
  'sea.arctic': {
    bgKey: 'sea-arctic-bg',      bgPath: 'assets/skins/Arctic/Arctic-bg.webp',
    bgMobileKey: 'sea-arctic-bg-mobile', bgMobilePath: 'assets/skins/Arctic/Arctic-bg-mobile.webp',
    islandKey: 'sea-arctic-island', islandPath: 'assets/skins/Arctic/Arctic-iland.webp',
    islandMobileKey: 'sea-arctic-island-mobile', islandMobilePath: 'assets/skins/Arctic/Arctic-iland-mobile.webp',
  },
  'sea.abyss': {
    bgKey: 'sea-abyss-bg',       bgPath: 'assets/skins/Abyss/Abyss-bg.webp',
    bgMobileKey: 'sea-abyss-bg-mobile', bgMobilePath: 'assets/skins/Abyss/Abyss-bg-mobile.webp',
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
