import { Button } from '../Button';
import styles from './LeaderboardButton.module.scss';
export function LeaderboardButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button testId="leaderboard-open" className={styles.leaderboardButton} label={`🏆 ${label}`} variant="ghost" onClick={onClick} />
  );
}
