import { useEffect } from 'react';
import { useUi } from '@hooks/useUiStore';
import { useProgress } from '@hooks/useProgress';
import { LOCALES } from '../../game/i18n';
import { formatTime } from '../../game/leaderboard';
import { levelFromXp } from '@state/progress';
import { closeProfile } from '@state/profileController';
import styles from './ProfileModal.module.scss';

const DIFFS = ['easy', 'medium', 'hard', 'expert'] as const;

export function ProfileModal() {
  const open = useUi((s) => s.modal.profile);
  const lang = useUi((s) => s.menu.lang);
  const stats = useProgress((s) => s.stats);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeProfile(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  if (!open) return null;
  const L = LOCALES[lang];
  const { level, into, span } = levelFromXp(stats.xp);
  const pct = span ? Math.round((into / span) * 100) : 0;
  return (
    <div className={styles.backdrop} data-testid="profile" onClick={closeProfile}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
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

        <div className={styles.bestTimes}>
          {DIFFS.map((d) => (
            <div key={d} className={styles.bestRow}>
              <span>{L.diffLabels[d]}</span>
              <span className={styles.bestTime}>{stats.bestSeconds[d] != null ? formatTime(stats.bestSeconds[d]!) : '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
