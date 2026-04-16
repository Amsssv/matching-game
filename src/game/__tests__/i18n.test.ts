import { describe, it, expect } from 'vitest';
import { LOCALES } from '../i18n';
import type { Lang, Locale } from '../i18n';

const LANGS: Lang[] = ['ru', 'en', 'tr', 'es', 'pt', 'ar'];
const DIFFS = ['easy', 'medium', 'hard', 'expert'] as const;

const STRING_KEYS: (keyof Locale)[] = [
  'title', 'subtitle', 'difficulty', 'sound', 'soundOn', 'soundOff',
  'play', 'menu', 'victory', 'allPairsFound', 'restart', 'toMenu',
];

describe('LOCALES', () => {
  for (const lang of LANGS) {
    describe(`${lang}`, () => {
      const L = LOCALES[lang];

      it('has all required string keys, non-empty', () => {
        for (const key of STRING_KEYS) {
          expect(typeof L[key], `key "${key}"`).toBe('string');
          expect((L[key] as string).length, `key "${key}" empty`).toBeGreaterThan(0);
        }
      });

      it('diffLabels defined for all difficulties', () => {
        for (const d of DIFFS) {
          expect(typeof L.diffLabels[d]).toBe('string');
          expect(L.diffLabels[d].length).toBeGreaterThan(0);
        }
      });

      it('diffDesc defined for all difficulties', () => {
        for (const d of DIFFS) {
          expect(typeof L.diffDesc[d]).toBe('string');
          expect(L.diffDesc[d].length).toBeGreaterThan(0);
        }
      });

      it('diffHint defined for all difficulties', () => {
        for (const d of DIFFS) {
          expect(typeof L.diffHint[d]).toBe('string');
          expect(L.diffHint[d].length).toBeGreaterThan(0);
        }
      });

      it('moves(n) contains the number', () => {
        const result = L.moves(7);
        expect(typeof result).toBe('string');
        expect(result).toContain('7');
      });

      it('pairs(n, total) contains both numbers', () => {
        const result = L.pairs(3, 10);
        expect(result).toContain('3');
        expect(result).toContain('10');
      });

      it('movesResult(n) contains the number', () => {
        expect(L.movesResult(42)).toContain('42');
      });

      it('timeResult(t) contains the time string', () => {
        expect(L.timeResult('02:45')).toContain('02:45');
      });
    });
  }
});