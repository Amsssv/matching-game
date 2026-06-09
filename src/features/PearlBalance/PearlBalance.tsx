import { useProgress } from '@hooks/useProgress';
import styles from './PearlBalance.module.scss';

export function PearlBalance() {
  const pearls = useProgress((s) => s.pearls);
  return (
    <div className={styles.root} data-testid="pearl-balance">
      <span className={styles.icon} aria-hidden>🦪</span>
      <span className={styles.count}>{pearls}</span>
    </div>
  );
}
