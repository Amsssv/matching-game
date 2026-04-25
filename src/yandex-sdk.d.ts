declare global {
  interface YandexGamesSDK {
    environment: {
      app: { id: string };
      i18n: { lang: string; tld: string };
      payload?: string;
    };
    deviceInfo: {
      type: 'desktop' | 'mobile' | 'tablet' | 'tv';
      isDesktop(): boolean;
      isMobile(): boolean;
      isTablet(): boolean;
      isTV(): boolean;
    };
    features: {
      LoadingAPI?: { ready(): void };
      GameplayAPI?: { start(): void; stop(): void };
    };
    adv: {
      showFullscreenAdv(opts: {
        callbacks: {
          onClose?: (wasShown: boolean) => void;
          onError?: (e: Error) => void;
        };
      }): void;
      showRewardedVideo(opts: {
        callbacks: {
          onRewarded(): void;
          onClose?: () => void;
          onError?: (e: Error) => void;
        };
      }): void;
    };
    getPlayer(opts?: { scopes?: boolean }): Promise<YandexPlayer>;
    leaderboards?: {
      setLeaderboardScore(name: string, score: number): Promise<void>;
      getLeaderboardPlayerEntry(name: string): Promise<unknown>;
    };
  }

  interface YandexPlayer {
    getMode(): 'lite' | '';
    getName(): string;
    getPhoto(size: 'small' | 'medium' | 'large'): string;
    getData(keys?: string[]): Promise<Record<string, unknown>>;
    setData(data: Record<string, unknown>, flush?: boolean): Promise<void>;
  }

  interface Window {
    YaGames?: { init(): Promise<YandexGamesSDK> };
  }
}

export {};