let ysdk: YandexGamesSDK | null = null;

export async function initYSDK(): Promise<void> {
  if (!window.YaGames) return;
  try {
    ysdk = await window.YaGames.init();
  } catch (e) {
    console.warn('[ysdk] init failed:', e);
  }
}

export function getYSDK(): YandexGamesSDK | null {
  return ysdk;
}