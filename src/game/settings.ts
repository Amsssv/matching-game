import { getYSDK } from '../ysdk';
import type { Lang } from './i18n';

export const SUPPORTED: Lang[] = ['ru', 'en', 'tr', 'es', 'pt', 'ar'];
const LS_KEY       = 'sea-pairs-lang';
const LS_SOUND_KEY = 'sea-pairs-sound';

function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (SUPPORTED as string[]).includes(value);
}

/**
 * Resolve the language to use, in priority order:
 * 1. Yandex SDK cloud data (authorized players)
 * 2. localStorage
 * 3. Yandex SDK environment lang (auto-detect)
 * 4. 'ru' (fallback)
 *
 * Never throws — any step that fails is silently skipped.
 */
export async function resolveLang(): Promise<Lang> {
  const sdk = getYSDK();

  // 1. Cloud data (authorized players only)
  if (sdk) {
    try {
      const player = await sdk.getPlayer({ scopes: false });
      if (player.getMode() !== 'lite') {
        const data = await player.getData(['lang']);
        if (isLang(data.lang)) return data.lang;
      }
    } catch {
      // cloud unavailable — fall through
    }
  }

  // 2. localStorage
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (isLang(stored)) return stored;
  } catch {
    // storage access blocked (e.g. private browsing)
  }

  // 3. SDK environment lang (auto-detect, no auth required)
  if (sdk) {
    const envLang = sdk.environment?.i18n?.lang;
    if (isLang(envLang)) return envLang;
  }

  // 4. Default
  return 'ru';
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
      if (player.getMode() !== 'lite') {
        await player.setData({ lang }, true);
      }
    } catch {
      // cloud save failed — localStorage is the reliable store
    }
  })();
}