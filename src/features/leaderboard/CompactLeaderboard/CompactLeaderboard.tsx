import { formatTime, type LeaderboardData } from '../../../game/leaderboard';
import { cx } from '@ui/cx';
import styles from './CompactLeaderboard.module.scss';

const MEDALS = ['🥇', '🥈', '🥉'];

export function CompactLeaderboard({ data }: { data: LeaderboardData }) {
  const idx = data.rows.findIndex((r) => r.isPlayer);
  const rows = idx === -1 ? data.rows.slice(0, 3) : data.rows.slice(Math.max(0, idx - 1), idx + 2);
  if (rows.length === 0) return null;
  return (
    <div className={styles.root} data-testid="compact-lb">
      {rows.map((r) => (
        <div key={r.rank} className={cx(styles.row, r.isPlayer && styles.player)}>
          <span className={styles.rank}>{r.rank <= 3 ? MEDALS[r.rank - 1] : `#${r.rank}`}</span>
          <span className={styles.name}>{r.name}</span>
          <span className={styles.time}>{formatTime(r.score)}</span>
        </div>
      ))}
    </div>
  );
}
