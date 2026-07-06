import Phaser from 'phaser';
import { GameScene } from './GameScene';
import { LOCALES } from '../i18n';
import type { Lang, Locale } from '../i18n';
import { getYSDK } from '../../ysdk';
import { fetchLeaderboard, formatTime, SCORE_BASE, LB_ID } from '../leaderboard';
import type { Difficulty } from '../layout';
import { TIME_ATTACK, timeAttackRemaining, type GameMode, type ModeTestOverrides, type TimeAttackCfg } from '../modes';
import { uiStore, setHud, setModal } from '../../state/store';
import { bus } from '../../state/eventBus';
import { openLeaderboard } from '../../state/leaderboardController';
import { computePearls, awardPearls, recordGameStart, recordGameWin, recordGameLoss, winContext } from '../../state/progress';
import { finishLevel } from '../../state/campaignController';
import { createPlayClock } from '../playClock';

/**
 * Thin UIScene: owns the play-clock, score submission, SDK/auth flow and the
 * GameScene event wiring. It renders nothing on the canvas — the header/HUD and
 * the victory modal are React (`src/widgets`), fed via the UI store, and
 * drive these actions via `cmd:*` events on the command bus.
 */
export class UIScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private totalPairs = 8;
  private elapsedSeconds = 0;
  private clock?: ReturnType<typeof createPlayClock>;
  private locale!: Locale;
  private mode: GameMode = 'classic';
  private taCfg: TimeAttackCfg = TIME_ATTACK.easy;
  private pairsFound = 0;
  private settled = false;   // once-gate shared by win + loss: economy writes happen exactly once
  private campaignLevelId: string | null = null;

  constructor() {
    super({ key: 'UIScene' });
  }

  init(data: { gameScene: GameScene }) {
    this.gameScene = data.gameScene;
    this.totalPairs = data.gameScene.totalPairs;
  }

  create() {
    this.elapsedSeconds = 0;
    recordGameStart();
    this.settled = false;
    this.pairsFound = 0;
    const lang: Lang = this.game.registry.get('lang') ?? 'ru';
    this.locale = LOCALES[lang];
    this.mode = this.game.registry.get('gameMode') ?? 'classic';
    this.campaignLevelId = this.game.registry.get('campaignLevel') ?? null;
    const difficulty: Difficulty = this.game.registry.get('difficulty') ?? 'medium';
    const ov: ModeTestOverrides = this.game.registry.get('modeTestOverrides') ?? {};
    this.taCfg = {
      startSec: ov.timeAttackStartSec ?? TIME_ATTACK[difficulty].startSec,
      bonusSec: ov.timeAttackBonusSec ?? TIME_ATTACK[difficulty].bonusSec,
    };

    setHud({
      active:     true,
      timer:      formatTime(this.mode === 'timeAttack' ? this.taCfg.startSec : 0),
      moves:      this.locale.moves(0),
      pairs:      this.locale.pairs(0, this.totalPairs),
      movesCount: 0,
      pairsFound: 0,
      pairsTotal: this.totalPairs,
      mode:       this.mode,
      timerWarning: false,
      preview:    null,
    });

    this.clock = createPlayClock((seconds) => {
      this.elapsedSeconds = seconds;
      if (this.mode === 'timeAttack') this.updateCountdown();
      else setHud({ timer: formatTime(seconds) });
    });
    if (this.mode !== 'noMistakes') this.clock.start();

    const onMoves = (n: number) => setHud({ moves: this.locale.moves(n), movesCount: n });
    const onMatch = (n: number) => {
      this.pairsFound = n;
      setHud({ pairs: this.locale.pairs(n, this.totalPairs), pairsFound: n });
      if (this.mode === 'timeAttack') this.updateCountdown();
    };
    const onComplete = (n: number) => {
      if (this.settled) return;
      this.settled = true;
      this.elapsedSeconds = this.clock?.stop() ?? this.elapsedSeconds;
      if (this.campaignLevelId) {
        finishLevel(this.campaignLevelId, { won: true, seconds: this.elapsedSeconds, moves: n, mistakes: 0 });
        this.exitToCampaign();
        return;
      }
      this.game.registry.set('lastScore', this.elapsedSeconds);
      getYSDK()?.features.GameplayAPI?.stop();
      const difficulty: Difficulty = this.game.registry.get('difficulty') ?? 'medium';
      const mode = this.currentMode();
      // Win context (record + win-of-day) read from state BEFORE recordGameWin updates it.
      const { isRecord, prevBest, winIndex, firstWinOfDay } = winContext(difficulty, this.elapsedSeconds, mode);
      const pearlsEarned = computePearls(difficulty, this.elapsedSeconds, n, this.totalPairs, { isRecord, winIndex }, mode);
      awardPearls(pearlsEarned);
      const win = recordGameWin({ difficulty, seconds: this.elapsedSeconds, pairs: this.totalPairs, moves: n, mode });
      const leaderboards = getYSDK()?.leaderboards;
      // Fire-and-forget: don't block victory screen on the network call. Yandex
      // setScore always overwrites — guard with getPlayerEntry so we only submit
      // when the new score is strictly better (higher = faster).
      const newYScore = SCORE_BASE - this.elapsedSeconds;
      const scoreSaved: Promise<void> = leaderboards
        ? leaderboards.getPlayerEntry(LB_ID[mode][difficulty])
            .then(entry => { if (newYScore > entry.score) return leaderboards.setScore(LB_ID[mode][difficulty], newYScore); })
            .catch(() => leaderboards.setScore(LB_ID[mode][difficulty], newYScore))
            .then(() => {}).catch(() => {})
        : Promise.resolve();
      this.showVictory(n, this.elapsedSeconds, scoreSaved, pearlsEarned, { isRecord, prevBest, firstWinOfDay, xpGained: win.xpGained, leveledUp: win.leveledUp, newLevel: win.newLevel });
    };

    const onGameOver = ({ reason, pairsFound }: { reason: 'timeout' | 'mistake'; pairsFound: number }) => {
      if (this.settled) return;
      this.settled = true;
      this.elapsedSeconds = this.clock?.stop() ?? this.elapsedSeconds;
      if (this.campaignLevelId) {
        finishLevel(this.campaignLevelId, { won: false, seconds: this.elapsedSeconds, moves: 0, mistakes: 0 });
        this.exitToCampaign();
        return;
      }
      getYSDK()?.features.GameplayAPI?.stop();
      const difficulty: Difficulty = this.game.registry.get('difficulty') ?? 'medium';
      const loss = recordGameLoss({ mode: this.mode, difficulty, pairsFound, totalPairs: this.totalPairs });
      this.audioManager()?.duck();
      setHud({ timerWarning: false });
      setModal({ defeat: {
        reason, pairsFound, totalPairs: this.totalPairs,
        pearlsEarned: loss.pearls, xpGained: loss.xp, leveledUp: loss.leveledUp, newLevel: loss.newLevel,
      } });
    };
    const onExpiryRecheck = () => { if (this.mode === 'timeAttack') this.updateCountdown(); };
    const onPairsReset = () => {
      this.pairsFound = 0;
      setHud({ pairs: this.locale.pairs(0, this.totalPairs), pairsFound: 0 });
    };
    const onPreviewTick = (n: number) => setHud({ preview: n });
    const onPreviewEnded = () => { setHud({ preview: null }); this.clock?.start(); };

    this.gameScene.events.on('moves-updated', onMoves,    this);
    this.gameScene.events.on('match-found',   onMatch,    this);
    this.gameScene.events.on('game-complete', onComplete, this);
    this.gameScene.events.on('game-over',      onGameOver,      this);
    this.gameScene.events.on('expiry-recheck', onExpiryRecheck, this);
    this.gameScene.events.on('pairs-reset',    onPairsReset,    this);
    this.gameScene.events.on('preview-tick',   onPreviewTick,   this);
    this.gameScene.events.on('preview-ended',  onPreviewEnded,  this);

    // React overlay (HUD menu button, victory modal) emits commands on the bus;
    // unsubscribe on shutdown so a stopped UIScene never double-fires.
    const offBus = [
      bus.on('cmd:exit-to-menu', () => this.exitToMenu()),
      bus.on('cmd:victory-restart', () => this.victoryRestart()),
      bus.on('cmd:victory-to-menu', () => this.victoryToMenu()),
      bus.on('cmd:open-leaderboard', ({ source }) => { if (source === 'victory') this.victoryOpenLeaderboard(); }),
      bus.on('cmd:login-and-save', () => this.loginAndSave()),
    ];

    this.events.once('shutdown', () => {
      setHud({ active: false });
      setModal({ victory: null, defeat: null });
      offBus.forEach((off) => off());
      this.clock?.stop();
      this.gameScene.events.off('moves-updated', onMoves,    this);
      this.gameScene.events.off('match-found',   onMatch,    this);
      this.gameScene.events.off('game-complete', onComplete, this);
      this.gameScene.events.off('game-over',      onGameOver,      this);
      this.gameScene.events.off('expiry-recheck', onExpiryRecheck, this);
      this.gameScene.events.off('pairs-reset',    onPairsReset,    this);
      this.gameScene.events.off('preview-tick',   onPreviewTick,   this);
      this.gameScene.events.off('preview-ended',  onPreviewEnded,  this);
      this.audioManager()?.unduck();
    });
  }

  /** Recompute remaining time → HUD (and end the game at 0). Called on every clock
   * tick AND on match-found, so the +bonus feedback is instant, not up-to-500ms late. */
  private updateCountdown() {
    const remaining = timeAttackRemaining(this.elapsedSeconds, this.pairsFound, this.taCfg);
    setHud({ timer: formatTime(remaining), timerWarning: remaining <= 5 && remaining > 0 });
    if (remaining <= 0) this.gameScene.tryEndByTimeout();
  }

  // ── Victory ──────────────────────────────────────────────────────────────────
  private showVictory(moves: number, seconds: number, scoreSaved: Promise<void>, pearlsEarned: number, ctx: { isRecord: boolean; prevBest: number | null; firstWinOfDay: boolean; xpGained: number; leveledUp: boolean; newLevel: number }) {
    this.audioManager()?.duck();
    setModal({ victory: { moves, seconds, compact: null, showAuthCta: false, pearlsEarned, doubled: false, ...ctx } });

    const difficulty: Difficulty = this.game.registry.get('difficulty') ?? 'medium';
    const mode = this.currentMode();
    // Chain after the score save so the compact leaderboard includes the new result.
    scoreSaved.then(() => fetchLeaderboard(mode, difficulty)).then(data => {
      const cur = uiStore.get().modal.victory;
      if (cur) setModal({ victory: { ...cur, compact: data ?? null } });
    }).catch(() => {});

    this.maybeShowAuthCta();
  }

  private maybeShowAuthCta(): void {
    // Per Yandex rule 1.2.1, the auth dialog only opens via the explicit CTA button.
    if (this.game.registry.get('authPromptShown')) return;
    const sdk = getYSDK();
    if (!sdk) return;
    sdk.getPlayer({ scopes: false }).then(player => {
      if (player.isAuthorized()) return;
      if (!this.scene.isActive('UIScene')) return;
      this.game.registry.set('authPromptShown', true);
      const cur = uiStore.get().modal.victory;
      if (cur) setModal({ victory: { ...cur, showAuthCta: true } });
    }).catch(() => {});
  }

  // ── Actions invoked from the command bus ─────────────────────────────────────
  exitToMenu() {
    this.scene.stop();
    this.gameScene.goToMenu();
  }

  /** Return from a campaign level to the journey map (CampaignScene). */
  exitToCampaign() {
    this.scene.stop();
    this.gameScene.goToCampaign();
  }

  victoryRestart() {
    this.audioManager()?.unduck();
    setModal({ victory: null, defeat: null });
    this.scene.stop();
    this.gameScene.restartGame();
  }

  victoryToMenu() {
    this.audioManager()?.unduck();
    setModal({ victory: null, defeat: null });
    this.scene.stop();
    this.gameScene.goToMenu();
  }

  victoryOpenLeaderboard() {
    openLeaderboard('victory', this.currentMode());
  }

  loginAndSave() {
    const sdk = getYSDK();
    if (!sdk) return;
    sdk.auth.openAuthDialog().then(result => {
      if (result.action !== 'login') return;
      sdk.getPlayer({ scopes: false }).then(p => {
        if (!p.isAuthorized()) return;
        const diff: Difficulty = this.game.registry.get('difficulty') ?? 'medium';
        const mode = this.currentMode();
        const lastSeconds: number = this.game.registry.get('lastScore') ?? this.elapsedSeconds;
        sdk.leaderboards?.setScore(LB_ID[mode][diff], SCORE_BASE - lastSeconds).catch(() => {});
      });
    }).catch(() => {});
  }

  private currentMode(): GameMode {
    return this.mode;
  }

  private audioManager(): import('../AudioManager').AudioManager | undefined {
    return this.game.registry.get('audioManager');
  }
}
