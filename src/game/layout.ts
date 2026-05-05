export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface Layout {
  cardW: number;
  cardH: number;
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
  areaW: number,
  areaH: number,
  originX: number,
  originY: number,
  fixedCardW?: number,
  fixedCardH?: number,
): Layout {
  const numRows = rowWidths.length;
  const maxCols = Math.max(...rowWidths);
  const minGap = 8;

  let cardW: number;
  let cardH: number;

  if (fixedCardW !== undefined && fixedCardH !== undefined) {
    cardW = fixedCardW;
    cardH = fixedCardH;
  } else {
    cardW = Math.floor((areaW - (maxCols - 1) * minGap) / maxCols);
    cardH = Math.round(cardW * (4 / 3));
    const maxCardH = Math.floor((areaH - (numRows - 1) * minGap) / numRows);
    if (cardH > maxCardH) {
      cardH = maxCardH;
      cardW = Math.round(cardH * (3 / 4));
    }
    cardH = Math.round(cardW * (4 / 3));
  }

  const gapX = Math.min(
    Math.max(Math.floor((areaW - maxCols * cardW) / Math.max(1, maxCols - 1)), minGap),
    24,
  );
  let gapY = Math.min(
    Math.max(Math.floor((areaH - numRows * cardH) / Math.max(1, numRows - 1)), minGap),
    24,
  );
  // Ensure grid actually fits
  let gridH = numRows * cardH + (numRows - 1) * gapY;
  if (gridH > areaH && numRows > 1) {
    gapY = Math.floor((areaH - numRows * cardH) / (numRows - 1));
    gridH = numRows * cardH + (numRows - 1) * gapY;
  }

  const startY = originY - gridH / 2 + cardH / 2;

  const positions: { x: number; y: number }[] = [];
  rowWidths.forEach((cols, rowIdx) => {
    const rowW = cols * cardW + (cols - 1) * gapX;
    const rowStartX = originX - rowW / 2 + cardW / 2;
    const y = startY + rowIdx * (cardH + gapY);
    for (let col = 0; col < cols; col++) {
      positions.push({ x: rowStartX + col * (cardW + gapX), y });
    }
  });

  return { cardW, cardH, positions };
}