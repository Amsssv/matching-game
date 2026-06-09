import Phaser from 'phaser';
import { GameScene } from './GameScene';
import { LOCALES } from '../i18n';
import type { Lang, Locale } from '../i18n';
import { getYSDK } from '../../ysdk';
import { fetchLeaderboard, formatTime, SCORE_BASE, LB_ID } from '../leaderboard';
import type { Difficulty } from '../layout';
import { uiStore, setHud, setModal } from '../../state/store';
import { bus } from '../../state/eventBus';
import { openLeaderboard } from '../../state/leaderboardController';
import { computePearls, awardPearls, recordGameStart, recordGameWin } from '../../state/progress';

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
  private timerEvent?: Phaser.Time.TimerEvent;
  private locale!: Locale;

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
    const lang: Lang = this.game.registry.get('lang') ?? 'ru';
    this.locale = LOCALES[lang];

    setHud({
      active:     true,
      timer:      formatTime(0),
      moves:      this.locale.moves(0),
      pairs:      this.locale.pairs(0, this.totalPairs),
      pairsFound: 0,
    });

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      repeat: -1,
      callback: () => {
        this.elapsedSeconds++;
        setHud({ timer: formatTime(this.elapsedSeconds) });
      },
    });

    const onMoves = (n: number) => setHud({ moves: this.locale.moves(n) });
    const onMatch = (n: number) => setHud({ pairs: this.locale.pairs(n, this.totalPairs), pairsFound: n });
    const onComplete = (n: number) => {
      this.timerEvent?.remove();
      this.game.registry.set('lastScore', this.elapsedSeconds);
      getYSDK()?.features.GameplayAPI?.stop();
      const difficulty: Difficulty = this.game.registry.get('difficulty') ?? 'medium';
      const pearlsEarned = computePearls(difficulty, this.elapsedSeconds, n, this.totalPairs);
      awardPearls(pearlsEarned);
      recordGameWin({ difficulty, seconds: this.elapsedSeconds, pairs: this.totalPairs, moves: n });
      const leaderboards = getYSDK()?.leaderboards;
      // Fire-and-forget: don't block victory screen on the network call. Yandex
      // setScore always overwrites — guard with getPlayerEntry so we only submit
      // when the new score is strictly better (higher = faster).
      const newYScore = SCORE_BASE - this.elapsedSeconds;
      const scoreSaved: Promise<void> = leaderboards
        ? leaderboards.getPlayerEntry(LB_ID[difficulty])
            .then(entry => { if (newYScore > entry.score) return leaderboards.setScore(LB_ID[difficulty], newYScore); })
            .catch(() => leaderboards.setScore(LB_ID[difficulty], newYScore))
            .then(() => {}).catch(() => {})
        : Promise.resolve();
      this.showVictory(n, this.elapsedSeconds, scoreSaved, pearlsEarned);
    };

    this.gameScene.events.on('moves-updated', onMoves,    this);
    this.gameScene.events.on('match-found',   onMatch,    this);
    this.gameScene.events.on('game-complete', onComplete, this);

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
      setModal({ victory: null });
      offBus.forEach((off) => off());
      this.timerEvent?.remove();
      this.gameScene.events.off('moves-updated', onMoves,    this);
      this.gameScene.events.off('match-found',   onMatch,    this);
      this.gameScene.events.off('game-complete', onComplete, this);
      this.audioManager()?.unduck();
    });
  }

  // ── Victory ──────────────────────────────────────────────────────────────────
  private showVictory(moves: number, seconds: number, scoreSaved: Promise<void> = Promise.resolve(), pearlsEarned = 0) {
    this.audioManager()?.duck();
    setModal({ victory: { moves, seconds, compact: null, showAuthCta: false, pearlsEarned } });

    const difficulty: Difficulty = this.game.registry.get('difficulty') ?? 'medium';
    // Chain after the score save so the compact leaderboard includes the new result.
    scoreSaved.then(() => fetchLeaderboard(difficulty)).then(data => {
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
    this.sfx('sfx-click');
    this.scene.stop();
    this.gameScene.goToMenu();
  }

  victoryRestart() {
    this.sfx('sfx-click');
    this.audioManager()?.unduck();
    setModal({ victory: null });
    this.scene.stop();
    this.gameScene.restartGame();
  }

  victoryToMenu() {
    this.sfx('sfx-click');
    this.audioManager()?.unduck();
    setModal({ victory: null });
    this.scene.stop();
    this.gameScene.goToMenu();
  }

  victoryOpenLeaderboard() {
    this.sfx('sfx-click');
    openLeaderboard('victory');
  }

  loginAndSave() {
    const sdk = getYSDK();
    if (!sdk) return;
    sdk.auth.openAuthDialog().then(result => {
      if (result.action !== 'login') return;
      sdk.getPlayer({ scopes: false }).then(p => {
        if (!p.isAuthorized()) return;
        const diff: Difficulty = this.game.registry.get('difficulty') ?? 'medium';
        const lastSeconds: number = this.game.registry.get('lastScore') ?? this.elapsedSeconds;
        sdk.leaderboards?.setScore(LB_ID[diff], SCORE_BASE - lastSeconds).catch(() => {});
      });
    }).catch(() => {});
  }

  private audioManager(): import('../AudioManager').AudioManager | undefined {
    return this.game.registry.get('audioManager');
  }

  private sfx(key: string) {
    const audioManager: import('../AudioManager').AudioManager | undefined = this.game.registry.get('audioManager');
    audioManager?.playSfx(key);
  }
}
