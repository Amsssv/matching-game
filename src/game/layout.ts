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

export function calcLayout(
  rowWidths: readonly number[],
  W: number,
  H: number,
  headerH: number,
): Layout {
  const padH = Math.max(40, H * 0.09);
  const padW = Math.max(8, W * 0.02);
  const availW = W - padW * 2;
  const availH = H - headerH - padH * 2;
  const numRows = rowWidths.length;
  const maxCols = Math.max(...rowWidths);

  const minGap = 8;
  let cardW = Math.floor((availW - (maxCols - 1) * minGap) / maxCols);
  let cardH = Math.round(cardW * (4 / 3));

  const maxCardH = Math.floor((availH - (numRows - 1) * minGap) / numRows);
  if (cardH > maxCardH) {
    cardH = maxCardH;
    cardW = Math.round(cardH * (3 / 4));
  }

  cardH = Math.round(cardW * (4 / 3));

  const gapX = Math.min(
    Math.max(Math.floor((availW - maxCols * cardW) / Math.max(1, maxCols - 1)), minGap),
    24,
  );
  const gapY = Math.min(
    Math.max(Math.floor((availH - numRows * cardH) / Math.max(1, numRows - 1)), minGap),
    24,
  );

  const gridH = numRows * cardH + (numRows - 1) * gapY;
  const startY = headerH + (availH - gridH) / 2 + padH + cardH / 2;

  const positions: { x: number; y: number }[] = [];
  rowWidths.forEach((cols, rowIdx) => {
    const rowW = cols * cardW + (cols - 1) * gapX;
    const rowStartX = (W - rowW) / 2 + cardW / 2;
    const y = startY + rowIdx * (cardH + gapY);
    for (let col = 0; col < cols; col++) {
      positions.push({ x: rowStartX + col * (cardW + gapX), y });
    }
  });

  return { cardW, cardH, positions };
}