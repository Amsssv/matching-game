import { describe, it, expect } from 'vitest';
import { LOCALES } from '../i18n';
import type { Lang, Locale } from '../i18n';

const LANGS: Lang[] = ['ru', 'en', 'tr', 'es', 'pt', 'ar'];
const DIFFS = ['easy', 'medium', 'hard', 'expert'] as const;
const MODES = ['classic', 'timeAttack', 'survival', 'noMistakes'] as const;
const BIOMES = ['lagoon', 'volcano', 'reef', 'arctic', 'abyss'] as const;

const STRING_KEYS: (keyof Locale)[] = [
  'title', 'subtitle', 'difficulty', 'sound', 'soundOn', 'soundOff',
  'play', 'menu', 'victory', 'allPairsFound', 'restart', 'toMenu',
  'modesTitle', 'modeRecommended', 'modeBeginner', 'playCta', 'memorize', 'defeatTimeout', 'defeatMistake',
  'journeyTitle', 'journeySubtitle', 'mapBack',
  'levelWord', 'goalComplete', 'goalMoves', 'goalTime', 'refillFor',
  'levelCleared', 'levelFailed', 'skinUnlocked', 'continue',
  'levelHint', 'levelHintDone',
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

      it('biomeNames defined for all campaign biomes', () => {
        for (const b of BIOMES) {
          expect(typeof L.biomeNames[b], `biomeNames.${b}`).toBe('string');
          expect(L.biomeNames[b].length, `biomeNames.${b} empty`).toBeGreaterThan(0);
        }
      });

      it('modeLabels + modeDesc defined for all modes', () => {
        for (const m of MODES) {
          expect(L.modeLabels[m].length, `modeLabels.${m}`).toBeGreaterThan(0);
          expect(L.modeDesc[m].length, `modeDesc.${m}`).toBeGreaterThan(0);
        }
      });

      it('mode function keys interpolate their numbers (western digits)', () => {
        expect(L.modeLockedLv(3)).toContain('3');
        expect(L.defeatPairs(2, 10)).toContain('2');
        expect(L.defeatPairs(2, 10)).toContain('10');
        expect(L.taParams(10, 3)).toContain('10');
        expect(L.taParams(10, 3)).toContain('3');
        expect(L.previewParams(5)).toContain('5');
      });

      it('levelHint carries the {n} placeholder', () => {
        expect(L.levelHint).toContain('{n}');
      });
    });
  }
});