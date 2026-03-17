declare global {
  interface YandexGamesSDK {
    features: {
      GameplayAPI?: { start(): void; stop(): void };
    };
    adv: {
      showInterstitial(opts: {
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
  }

  interface Window {
    YaGames?: { init(): Promise<YandexGamesSDK> };
  }
}

export {};