/** A point in percentage coordinates (0..100) of the island stage. */
export interface Pt { x: number; y: number }

/** Column X centers (%) and row Y centers (%) of the 4×3 level grid, spread
 * over the tall portrait island board (rows spaced out to use the height). */
const COLS = [20, 40, 60, 80];
const ROWS = [25, 45, 65];

/**
 * Positions of the 12 level nodes as a serpentine (boustrophedon) 4×3 grid,
 * in level-index order (index 0 = level 1 … 11 = level 12). Row 1 runs
 * left→right, row 2 right→left, row 3 left→right, so walking the array in
 * order traces the winding trail.
 */
export function mobileNodeLayout(): Pt[] {
  const pts: Pt[] = [];
  for (let row = 0; row < ROWS.length; row++) {
    const cols = row % 2 === 0 ? COLS : [...COLS].reverse();
    for (const x of cols) pts.push({ x, y: ROWS[row] });
  }
  return pts;
}

/**
 * Round "pebble" dots spread evenly along the polyline through the layout
 * (consecutive nodes), strictly between node centers so no dot lands on a
 * node. `spacing` is in the same %-space as the layout.
 */
export function pebbleDots(layout: Pt[], spacing = 6): Pt[] {
  const dots: Pt[] = [];
  for (let i = 0; i < layout.length - 1; i++) {
    const a = layout[i];
    const b = layout[i + 1];
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(1, Math.round(dist / spacing));
    for (let k = 1; k <= n; k++) {
      const t = k / (n + 1);
      dots.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return dots;
}
