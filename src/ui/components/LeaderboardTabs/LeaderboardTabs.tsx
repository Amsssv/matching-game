import { Button } from '../Button';
import styles from './LeaderboardTabs.module.scss';
import type { Difficulty } from '../../../game/layout';
import type { Locale } from '../../../game/i18n';

const ORDER: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];
export function LeaderboardTabs({ L, current, onPick }:
  { L: Locale; current: Difficulty; onPick: (d: Difficulty) => void }) {
  return (
    <div className={styles.root} data-testid="lb-tabs">
      {ORDER.map((d) => (
        <Button key={d} testId={`lb-tab-${d}`} label={L.diffLabels[d]} variant="primary"
                active={d === current} onClick={() => onPick(d)} />
      ))}
    </div>
  );
}
