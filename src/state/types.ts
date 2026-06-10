import type { Difficulty } from '../game/layout';
import type { Lang } from '../game/i18n';
import type { LeaderboardData } from '../game/leaderboard';
import type { CustomAxis } from './catalog';

export interface MenuState {
  active: boolean;
  difficulty: Difficulty;
  soundEnabled: boolean;
  lang: Lang;
}

export interface HudState {
  active: boolean;
  timer: string;        // "0:00"
  moves: string;        // localized "Ходов: 3" (a11y label)
  pairs: string;        // localized "Пар: 2 / 10" (a11y label)
  movesCount: number;   // raw moves count (HUD value)
  pairsFound: number;
  pairsTotal: number;   // total pairs (for the HUD progress bar)
}

export interface VictoryView {
  moves: number;
  seconds: number;
  compact: LeaderboardData | null;  // filled after fetch
  showAuthCta: boolean;
  pearlsEarned: number;   // pearls awarded for this win (shown in the victory modal)
  isRecord: boolean;      // new best time for this difficulty
  prevBest: number | null; // previous best seconds (for delta-to-record), null on first win
  doubled: boolean;       // reward already doubled via rewarded ad
  firstWinOfDay: boolean; // this win was the day's first (reward ×2 already baked in)
  xpGained: number;       // XP earned for this win
  leveledUp: boolean;     // this win raised the player level
  newLevel: number;       // resulting player level
}

export interface LeaderboardView {
  difficulty: Difficulty;
  data: LeaderboardData | null;     // null = loading
  isGuest: boolean;
  source: 'menu' | 'victory';
}

export interface DailyView {
  day: number;
  reward: number;
  claimed: boolean;
  doubled: boolean;
}

export type TasksTab = 'quests' | 'achievements';

export interface ModalState {
  victory: VictoryView | null;
  leaderboard: LeaderboardView | null;
  shop: { tab: CustomAxis } | null;
  daily: DailyView | null;
  tasks: { tab: TasksTab } | null;
  profile: boolean;   // player profile / level modal (B8)
  help: boolean;      // "how to play" modal
}

export interface TransitionState {
  /**
   * Drives the DOM overlay's cross-fade so it tracks Phaser's 300ms camera fade
   * between scenes. Scenes set `false` right before a `fadeOut` and `true` in
   * their `create()` (alongside `fadeIn`).
   */
  visible: boolean;
}

/**
 * Single UI store shape. One store with four independent slices; setters in
 * `store.ts` replace only their own slice so slice-scoped selectors
 * (`useUi(s => s.menu)`) re-render only the components that read that slice.
 */
export interface UiState {
  menu: MenuState;
  hud: HudState;
  modal: ModalState;
  transition: TransitionState;
}
