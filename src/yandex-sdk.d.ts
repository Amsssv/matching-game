declare global {
  interface YandexLeaderboardEntry {
    score: number;
    rank: number;
    player: { publicName: string; getAvatarSrc(size: string): string };
    formattedScore: string;
  }

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
    auth: {
      openAuthDialog(): Promise<{ action: 'close' | 'login' }>;
    };
    adv: {
      showFullscreenAdv(opts: {
        callbacks: {
          onOpen?:  () => void;
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
      showBannerAdv(): void;
      hideBannerAdv(): void;
      getBannerAdvStatus(): Promise<{ stickyAdvIsShowing: boolean; reason?: string }>;
    };
    getPlayer(opts?: { scopes?: boolean }): Promise<YandexPlayer>;
    leaderboards?: {
      setScore(name: string, score: number, extraData?: string): Promise<void>;
      getPlayerEntry(name: string): Promise<YandexLeaderboardEntry>;
      getEntries(name: string, opts?: {
        quantityTop?: number;
        includeUser?: boolean;
        quantityAround?: number;
      }): Promise<{ entries: YandexLeaderboardEntry[] }>;
    };
  }

  interface YandexPlayer {
    isAuthorized(): boolean;
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