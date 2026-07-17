export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface Layout {
  cardWidth: number;
  cardHeight: number;
  positions: { x: number; y: number }[];
}

export const DIFF_ROWS: Record<Difficulty, readonly number[]> = {
  easy:   [2, 4, 4, 2],   // 12 cards, 6 pairs
  medium: [4, 6, 6, 4],   // 20 cards, 10 pairs
  hard:   [5, 7, 7, 5],   // 24 cards, 12 pairs
  expert: [6, 8, 8, 6],   // 28 cards, 14 pairs
};

// Mobile: first/last row = N-2, middle rows = N (mirrors desktop pattern)
export const DIFF_ROWS_MOBILE: Record<Difficulty, readonly number[]> = {
  easy:   [2, 4, 4, 2],                  // 12 cards, 4 rows
  medium: [2, 4, 4, 4, 4, 2],            // 20 cards, 6 rows
  hard:   [2, 4, 4, 4, 4, 4, 2],         // 24 cards, 7 rows
  expert: [2, 4, 4, 4, 4, 4, 4, 2],      // 28 cards, 8 rows
};

// Campaign boards are sized by an explicit pair count N (2..14), not the 4 free-play
// tiers — one octagon-ish grid per N (narrow end rows). Every entry sums to 2N cards.
// Values at N=6/10/12/14 match DIFF_ROWS(_MOBILE) so the shared layout math is unchanged.
export const PAIR_ROWS: Record<number, readonly number[]> = {
  2:  [2, 2],
  3:  [3, 3],
  4:  [4, 4],
  5:  [2, 3, 3, 2],
  6:  [2, 4, 4, 2],
  7:  [3, 4, 4, 3],
  8:  [3, 5, 5, 3],
  9:  [4, 5, 5, 4],
  10: [4, 6, 6, 4],
  11: [5, 6, 6, 5],
  12: [5, 7, 7, 5],
  13: [6, 7, 7, 6],
  14: [6, 8, 8, 6],
};
// Portrait: narrow (2/3) end rows, 4-wide interior — the tall mobile board pattern.
export const PAIR_ROWS_MOBILE: Record<number, readonly number[]> = {
  2:  [2, 2],
  3:  [3, 3],
  4:  [2, 4, 2],
  5:  [2, 3, 3, 2],
  6:  [2, 4, 4, 2],
  7:  [2, 3, 4, 3, 2],
  8:  [2, 4, 4, 4, 2],
  9:  [2, 3, 4, 4, 3, 2],
  10: [2, 4, 4, 4, 4, 2],
  11: [2, 3, 4, 4, 4, 3, 2],
  12: [2, 4, 4, 4, 4, 4, 2],
  13: [2, 3, 4, 4, 4, 4, 3, 2],
  14: [2, 4, 4, 4, 4, 4, 4, 2],
};

export function calcLayout(
  rowWidths: readonly number[],
  areaWidth: number,
  areaHeight: number,
  originX: number,
  originY: number,
  fixedCardWidth?: number,
  fixedCardHeight?: number,
): Layout {
  const rowCount = rowWidths.length;
  const maxColumns = Math.max(...rowWidths);
  const minGap = 8;

  let cardWidth: number;
  let cardHeight: number;

  if (fixedCardWidth !== undefined && fixedCardHeight !== undefined) {
    cardWidth = fixedCardWidth;
    cardHeight = fixedCardHeight;
  } else {
    cardWidth = Math.floor((areaWidth - (maxColumns - 1) * minGap) / maxColumns);
    cardHeight = Math.round(cardWidth * (4 / 3));
    const maxCardHeight = Math.floor((areaHeight - (rowCount - 1) * minGap) / rowCount);
    if (cardHeight > maxCardHeight) {
      cardHeight = maxCardHeight;
      cardWidth = Math.round(cardHeight * (3 / 4));
    }
    cardHeight = Math.round(cardWidth * (4 / 3));
  }

  const horizontalGap = Math.min(
    Math.max(Math.floor((areaWidth - maxColumns * cardWidth) / Math.max(1, maxColumns - 1)), minGap),
    24,
  );
  let verticalGap = Math.min(
    Math.max(Math.floor((areaHeight - rowCount * cardHeight) / Math.max(1, rowCount - 1)), minGap),
    24,
  );
  // Ensure grid actually fits
  let gridHeight = rowCount * cardHeight + (rowCount - 1) * verticalGap;
  if (gridHeight > areaHeight && rowCount > 1) {
    verticalGap = Math.floor((areaHeight - rowCount * cardHeight) / (rowCount - 1));
    gridHeight = rowCount * cardHeight + (rowCount - 1) * verticalGap;
  }

  const startY = originY - gridHeight / 2 + cardHeight / 2;

  const positions: { x: number; y: number }[] = [];
  rowWidths.forEach((columns, rowIdx) => {
    const rowWidth = columns * cardWidth + (columns - 1) * horizontalGap;
    const rowStartX = originX - rowWidth / 2 + cardWidth / 2;
    const y = startY + rowIdx * (cardHeight + verticalGap);
    for (let col = 0; col < columns; col++) {
      positions.push({ x: rowStartX + col * (cardWidth + horizontalGap), y });
    }
  });

  return { cardWidth, cardHeight, positions };
}