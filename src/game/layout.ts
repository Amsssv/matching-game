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