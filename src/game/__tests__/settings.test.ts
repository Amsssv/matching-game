import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── readSoundEnabled / saveSoundEnabled ──────────────────────────────────────
// These functions do not have module-level state so they can be imported once.
import { readSoundEnabled, saveSoundEnabled, saveLang } from '../settings';

describe('readSoundEnabled', () => {
  beforeEach(() => localStorage.clear());

  it('returns true when nothing is stored', () => {
    expect(readSoundEnabled()).toBe(true);
  });

  it('returns true when "true" is stored', () => {
    localStorage.setItem('sea-pairs-sound', 'true');
    expect(readSoundEnabled()).toBe(true);
  });

  it('returns false when "false" is stored', () => {
    localStorage.setItem('sea-pairs-sound', 'false');
    expect(readSoundEnabled()).toBe(false);
  });

  it('returns true when an unknown value is stored', () => {
    localStorage.setItem('sea-pairs-sound', 'yes');
    expect(readSoundEnabled()).toBe(true);
  });

  it('returns true when localStorage throws', () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = () => { throw new Error('blocked'); };
    expect(readSoundEnabled()).toBe(true);
    Storage.prototype.getItem = original;
  });
});

describe('saveSoundEnabled', () => {
  beforeEach(() => localStorage.clear());

  it('writes "true" to localStorage', () => {
    saveSoundEnabled(true);
    expect(localStorage.getItem('sea-pairs-sound')).toBe('true');
  });

  it('writes "false" to localStorage', () => {
    saveSoundEnabled(false);
    expect(localStorage.getItem('sea-pairs-sound')).toBe('false');
  });

  it('does not throw when localStorage throws', () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('blocked'); };
    expect(() => saveSoundEnabled(true)).not.toThrow();
    Storage.prototype.setItem = original;
  });
});

describe('saveLang', () => {
  beforeEach(() => localStorage.clear());

  it('writes lang to localStorage', () => {
    saveLang('en');
    expect(localStorage.getItem('sea-pairs-lang')).toBe('en');
  });

  it('does not throw when SDK is unavailable', () => {
    // getYSDK() returns null when SDK is not loaded — this is the default in tests
    expect(() => saveLang('tr')).not.toThrow();
  });
});

// ── resolveLang ──────────────────────────────────────────────────────────────
// resolveLang has module-level cache (_cachedLang).
// We must use vi.resetModules() + vi.doMock() + dynamic import per test.

describe('resolveLang', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it('returns "ru" when nothing is configured', async () => {
    vi.doMock('../../ysdk', () => ({ getYSDK: () => null }));
    const { resolveLang } = await import('../settings');
    expect(await resolveLang()).toBe('ru');
  });

  it('returns lang from localStorage', async () => {
    localStorage.setItem('sea-pairs-lang', 'en');
    vi.doMock('../../ysdk', () => ({ getYSDK: () => null }));
    const { resolveLang } = await import('../settings');
    expect(await resolveLang()).toBe('en');
  });

  it('ignores invalid value in localStorage', async () => {
    localStorage.setItem('sea-pairs-lang', 'xx');
    vi.doMock('../../ysdk', () => ({ getYSDK: () => null }));
    const { resolveLang } = await import('../settings');
    expect(await resolveLang()).toBe('ru');
  });

  it('prefers SDK env lang over localStorage', async () => {
    localStorage.setItem('sea-pairs-lang', 'en');
    vi.doMock('../../ysdk', () => ({
      getYSDK: () => ({
        environment: { i18n: { lang: 'tr' } },
        getPlayer: async () => ({ isAuthorized: () => false, getData: async () => ({}) }),
      }),
    }));
    const { resolveLang } = await import('../settings');
    expect(await resolveLang()).toBe('tr');
  });

  it('prefers cloud data over SDK env lang', async () => {
    vi.doMock('../../ysdk', () => ({
      getYSDK: () => ({
        environment: { i18n: { lang: 'tr' } },
        getPlayer: async () => ({
          isAuthorized: () => true,
          getData: async (_keys: string[]) => ({ lang: 'es' }),
        }),
      }),
    }));
    const { resolveLang } = await import('../settings');
    expect(await resolveLang()).toBe('es');
  });

  it('falls back to SDK env lang when cloud data has no lang key', async () => {
    vi.doMock('../../ysdk', () => ({
      getYSDK: () => ({
        environment: { i18n: { lang: 'pt' } },
        getPlayer: async () => ({
          isAuthorized: () => true,
          getData: async () => ({}),
        }),
      }),
    }));
    const { resolveLang } = await import('../settings');
    expect(await resolveLang()).toBe('pt');
  });

  it('falls back to localStorage when SDK getPlayer throws', async () => {
    localStorage.setItem('sea-pairs-lang', 'ar');
    vi.doMock('../../ysdk', () => ({
      getYSDK: () => ({
        environment: { i18n: { lang: 'xx' } },
        getPlayer: async () => { throw new Error('network'); },
      }),
    }));
    const { resolveLang } = await import('../settings');
    expect(await resolveLang()).toBe('ar');
  });
});