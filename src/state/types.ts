import type { Difficulty } from '../game/layout';
import type { Lang } from '../game/i18n';
import type { LeaderboardData } from '../game/leaderboard';
import type { CustomAxis } from './catalog';
import type { GameMode } from '../game/modes';

export interface MenuState {
  active: boolean;
  difficulty: Difficulty;
  mode: GameMode;          // last played mode (leaderboard modal default)
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
  mode: GameMode;          // current game's mode (HUD indicator; 'classic' shows nothing)
  timerWarning: boolean;   // timeAttack: ≤5s left → red pulse
  preview: number | null;  // noMistakes: seconds left in the memorize overlay (null = hidden)
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
  mode: GameMode;
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

export interface DefeatView {
  reason: 'timeout' | 'mistake';
  pairsFound: number;
  totalPairs: number;
  pearlsEarned: number;   // consolation pearls (0 possible — hide the line)
  xpGained: number;
  leveledUp: boolean;
  newLevel: number;
}

export type TasksTab = 'quests' | 'achievements';

export interface ModalState {
  victory: VictoryView | null;
  defeat: DefeatView | null;
  modeStart: GameMode | null;   // which mode's difficulty-select modal is open
  leaderboard: LeaderboardView | null;
  shop: { tab: CustomAxis } | null;
  daily: DailyView | null;
  tasks: { tab: TasksTab } | null;
  profile: boolean;   // player profile / level modal (B8)
  help: boolean;      // "how to play" modal
  store: boolean;     // premium store modal — packs + bundles + exclusives (B7 + exclusives)
  levelUp: { level: number; reward: number } | null;   // level-up celebration (shown in menu)
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
