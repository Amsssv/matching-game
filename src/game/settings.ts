import { getYSDK } from '../ysdk';
import type { Lang } from './i18n';

export const SUPPORTED: Lang[] = ['ru', 'en', 'tr', 'es', 'pt', 'ar'];
const LS_KEY       = 'sea-pairs-lang';
const LS_SOUND_KEY = 'sea-pairs-sound';

function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (SUPPORTED as string[]).includes(value);
}

// Resolved once at startup (main.tsx), before Phaser initialises.
let _cachedLang: Lang | null = null;

/**
 * Resolve the language to use, in priority order:
 * 1. Yandex SDK cloud data (authorized players — explicit in-game choice)
 * 2. Yandex SDK environment lang (platform language for Yandex users)
 * 3. localStorage (explicit in-game choice for offline / non-SDK users)
 * 4. 'ru' (fallback)
 *
 * The result is cached after the first call so BootScene can consume it
 * synchronously on any subsequent call.
 *
 * Never throws — any step that fails is silently skipped.
 */
export async function resolveLang(): Promise<Lang> {
  if (_cachedLang !== null) return _cachedLang;

  const sdk = getYSDK();

  // Always read SDK env lang first so the Yandex debug panel registers i18n
  // as used (it tracks whether .lang is accessed via a proxy).
  // Direct property access (not ?.) is intentional — environment.i18n is
  // always defined on an initialized SDK instance.
  const sdkEnvLang: string | null = sdk ? sdk.environment.i18n.lang : null;

  // 1. Cloud data (authorized players only)
  if (sdk) {
    try {
      const player = await sdk.getPlayer({ scopes: false });
      if (player.isAuthorized()) {
        const data = await player.getData(['lang']);
        if (isLang(data.lang)) return (_cachedLang = data.lang);
      }
    } catch {
      // cloud unavailable — fall through
    }
  }

  // 2. SDK environment lang — platform default for first-time Yandex users
  //    (takes precedence over localStorage so the platform language wins when
  //     the user hasn't made an explicit in-game choice on this device)
  if (isLang(sdkEnvLang)) return (_cachedLang = sdkEnvLang);

  // 3. localStorage — explicit in-game choice for offline / non-SDK users
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (isLang(stored)) return (_cachedLang = stored);
  } catch {
    // storage access blocked (e.g. private browsing)
  }

  // 4. Default
  return (_cachedLang = 'ru');
}

/**
 * Read the persisted sound setting.
 * Returns true (sound on) if nothing is stored.
 */
export function readSoundEnabled(): boolean {
  try {
    const stored = localStorage.getItem(LS_SOUND_KEY);
    if (stored === 'true')  return true;
    if (stored === 'false') return false;
  } catch {
    // storage access blocked (e.g. private browsing)
  }
  return true;
}

/**
 * Persist the sound setting.
 */
export function saveSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(LS_SOUND_KEY, String(enabled));
  } catch {
    // storage access blocked (e.g. private browsing)
  }
}

/**
 * Persist the chosen language.
 * localStorage is written synchronously (reliable).
 * Cloud save is fire-and-forget (best-effort).
 */
export function saveLang(lang: Lang): void {
  try {
    localStorage.setItem(LS_KEY, lang);
  } catch {
    // storage access blocked (e.g. private browsing)
  }

  const sdk = getYSDK();
  if (!sdk) return;

  (async () => {
    try {
      const player = await sdk.getPlayer({ scopes: false });
      if (player.isAuthorized()) {
        await player.setData({ lang }, true);
      }
    } catch {
      // cloud save failed — localStorage is the reliable store
    }
  })();
}