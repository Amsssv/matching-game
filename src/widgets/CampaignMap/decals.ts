// Journey map decoration layers (paths + small decor islands), rendered at runtime as
// positioned <img> layers over the ocean background — the baked world-map composite is gone.
// Positions carry over from the old offline compositor; desktop `h` = w·(1920/1080)·(nativeH/nativeW)
// so each piece distorts identically to the stretched desktop background (stays glued to islands).
export interface Decal {
  art: string;   // path under BASE_URL
  x: number;     // center X, % of the map box
  y: number;     // center Y, % of the map box
  w: number;     // width, % of the map box
  h?: number;    // desktop height, % of the viewport (distortion-fill); omitted on mobile (natural aspect)
}

// Desktop: background is stretched full-viewport, so decals need width% AND height%.
export const DESKTOP_DECALS: Decal[] = [
  { art: 'assets/journey/path/path1.webp', x: 50, y: 22, w: 34, h: 15.1 },
  { art: 'assets/journey/path/path2.webp', x: 78, y: 51, w: 6, h: 19.3 },
  { art: 'assets/journey/path/path3.webp', x: 50, y: 81, w: 30, h: 9.1 },
  { art: 'assets/journey/path/path4.webp', x: 38, y: 64, w: 10, h: 10.2 },
  { art: 'assets/journey/small_island/small_island_1.webp', x: 36, y: 13, w: 8, h: 12.4 },
  { art: 'assets/journey/small_island/small_island_3.webp', x: 63, y: 14, w: 11, h: 19.7 },
  { art: 'assets/journey/small_island/small_island_4.webp', x: 88, y: 45, w: 6, h: 6.9 },
  { art: 'assets/journey/small_island/small_island_5.webp', x: 59, y: 90, w: 9, h: 12.9 },
  { art: 'assets/journey/small_island/small_island_6.webp', x: 11, y: 57, w: 8, h: 7.9 },
  { art: 'assets/journey/small_island/small_island_7.webp', x: 31, y: 90, w: 10, h: 12.4 },
  { art: 'assets/journey/small_island/small_island_2.webp', x: 9, y: 42, w: 8, h: 10.9 },
];

// Mobile: background is a natural-aspect <img>, so decals use width% + natural height.
export const MOBILE_DECALS: Decal[] = [
  { art: 'assets/journey/path/path1_mobile.webp', x: 50, y: 20.75, w: 12 },
  { art: 'assets/journey/path/path2_mobile.webp', x: 50, y: 40.25, w: 12 },
  { art: 'assets/journey/path/path1_mobile.webp', x: 50, y: 59, w: 12 },
  { art: 'assets/journey/path/path2_mobile.webp', x: 50, y: 78.25, w: 12 },
  { art: 'assets/journey/small_island/small_island_1.webp', x: 82, y: 5.5, w: 15 },
  { art: 'assets/journey/small_island/small_island_2.webp', x: 11, y: 16, w: 11 },
  { art: 'assets/journey/small_island/small_island_4.webp', x: 83, y: 26.5, w: 12 },
  { art: 'assets/journey/small_island/small_island_3.webp', x: 13, y: 40, w: 16 },
  { art: 'assets/journey/small_island/small_island_5.webp', x: 86, y: 60, w: 12 },
  { art: 'assets/journey/small_island/small_island_6.webp', x: 12, y: 62.5, w: 13 },
  { art: 'assets/journey/small_island/small_island_7.webp', x: 80, y: 79.5, w: 15 },
];
