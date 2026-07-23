import { useState } from 'react';
import { useUi } from '@hooks/useUiStore';
import { useProgress } from '@hooks/useProgress';
import { LOCALES } from '../../game/i18n';
import { formatTime } from '../../game/leaderboard';
import { MODE_ORDER, MODE_UNLOCK, type GameMode } from '../../game/modes';
import { levelFromXp } from '@state/progress';
import { closeProfile } from '@state/profileController';
import { Modal } from '@ui/Modal';
import { cx } from '@ui/cx';
import styles from './ProfileModal.module.scss';

const DIFFS = ['easy', 'medium', 'hard', 'expert'] as const;

export function ProfileModal() {
  const open = useUi((s) => s.modal.profile);
  const lang = useUi((s) => s.menu.lang);
  const stats = useProgress((s) => s.stats);
  const [mode, setMode] = useState<GameMode>('classic');
  if (!open) return null;
  const L = LOCALES[lang];
  const { level, into, span } = levelFromXp(stats.xp);
  const pct = span ? Math.round((into / span) * 100) : 0;

  // Best time for a (mode, difficulty): classic lives in bestSeconds, the other modes in modeBests.
  const bestFor = (m: GameMode, d: typeof DIFFS[number]): number | null =>
    m === 'classic' ? stats.bestSeconds[d] : stats.modeBests[m][d];
  // Only offer modes the player has actually unlocked; a locked mode has no records anyway.
  const modes = MODE_ORDER.filter((m) => level >= MODE_UNLOCK[m]);
  const activeMode = modes.includes(mode) ? mode : 'classic';

  return (
    <Modal testId="profile" onClose={closeProfile} width="min(92vw, 420px)">
      <header className={styles.head}>
        <h2 className={styles.title}>{L.profile}</h2>
        <button type="button" data-testid="profile-close" className={styles.close} aria-label={L.lbClose} onClick={closeProfile}>×</button>
      </header>

      <div className={styles.levelBlock}>
        <span className={styles.level}>{L.level} {level}</span>
        <div className={styles.bar}><div className={styles.fill} style={{ width: `${pct}%` }} /></div>
        <span className={styles.xp}>{into} / {span} XP</span>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}><span className={styles.statValue}>{stats.gamesPlayed}</span><span className={styles.statLabel}>{L.statGames}</span></div>
        <div className={styles.stat}><span className={styles.statValue}>{stats.gamesWon}</span><span className={styles.statLabel}>{L.statWins}</span></div>
        <div className={styles.stat}><span className={styles.statValue}>{stats.pairsMatched}</span><span className={styles.statLabel}>{L.statPairs}</span></div>
      </div>

      {modes.length > 1 && (
        <div className={styles.modeTabs} role="tablist">
          {modes.map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={m === activeMode}
              data-testid={`profile-mode-${m}`}
              className={cx(styles.modeTab, m === activeMode && styles.modeTabActive)}
              onClick={() => setMode(m)}
            >
              {L.modeLabels[m]}
            </button>
          ))}
        </div>
      )}

      <div className={styles.bestTimes}>
        {DIFFS.map((d) => (
          <div key={d} className={styles.bestRow}>
            <span>{L.diffLabels[d]}</span>
            <span className={styles.bestTime}>{bestFor(activeMode, d) != null ? formatTime(bestFor(activeMode, d)!) : '—'}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}
