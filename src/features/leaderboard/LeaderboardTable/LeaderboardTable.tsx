import { formatTime, type LeaderboardData } from '../../../game/leaderboard';
import type { Locale } from '../../../game/i18n';
import { cx } from '@ui/cx';
import styles from './LeaderboardTable.module.scss';

const MEDALS = ['🥇', '🥈', '🥉'];

export function LeaderboardTable({ L, data }: { L: Locale; data: LeaderboardData | null }) {
  if (data === null) return <p className={styles.state} data-testid="lb-loading">{L.lbLoading}</p>;
  if (data.rows.length === 0) return <p className={styles.state} data-testid="lb-empty">{L.lbEmpty}</p>;

  // Keep the player's row visible even when they rank below the shown top-N.
  const idx = data.rows.findIndex((r) => r.isPlayer);
  const max = 10;
  const rows = idx >= max
    ? [...data.rows.slice(0, max - 2), 'sep' as const, data.rows[idx]]
    : data.rows.slice(0, max);

  return (
    <div className={styles.table} data-testid="lb-table">
      <div className={styles.header}>
        <span>#</span><span>{L.lbPlayer}</span><span>{L.timeLabel}</span>
      </div>
      <div className={styles.body}>
        {rows.map((r, i) => r === 'sep'
          ? <div key={`sep${i}`} className={styles.separator}>· · ·</div>
          : <div key={r.rank} className={cx(styles.row, r.isPlayer && styles.player)}>
              <span className={styles.rank}>{r.rank <= 3 ? MEDALS[r.rank - 1] : `#${r.rank}`}</span>
              <span className={styles.name}>{r.name}</span>
              <span className={styles.time}>{formatTime(r.score)}</span>
            </div>)}
      </div>
    </div>
  );
}
