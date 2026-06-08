import { formatTime, type LeaderboardData } from '../../../../game/leaderboard';
import type { Locale } from '../../../../game/i18n';
import { cx } from '@ui/cx';
import styles from './LeaderboardTable.module.scss';

export function LeaderboardTable({ L, data }: { L: Locale; data: LeaderboardData | null }) {
  if (data === null) return <p className={styles.state} data-testid="lb-loading">{L.lbLoading}</p>;
  if (data.rows.length === 0) return <p className={styles.state}>—</p>;
  const idx = data.rows.findIndex((r) => r.isPlayer);
  const max = 10;
  const rows = idx >= max
    ? [...data.rows.slice(0, max - 2), 'sep' as const, data.rows[idx]]
    : data.rows.slice(0, max);
  return (
    <div className={styles.root} data-testid="lb-table">
      {rows.map((r, i) => r === 'sep'
        ? <div key={`sep${i}`} className={styles.separator}>· · ·</div>
        : <div key={r.rank} className={cx(styles.row, r.isPlayer && styles.player)}>
            <span>#{r.rank}</span><span>{r.name}</span><span>{formatTime(r.score)}</span>
          </div>)}
    </div>
  );
}
