import { Button } from '../Button';
import styles from './DifficultyPicker.module.scss';
import type { Difficulty } from '../../../game/layout';
import type { Locale } from '../../../game/i18n';

const ORDER: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

export function DifficultyPicker({
  L, current, onPick,
}: { L: Locale; current: Difficulty; onPick: (d: Difficulty) => void }) {
  return (
    <div className={styles.root} data-testid="difficulty">
      <p className={styles.label}>{L.difficulty}</p>
      <div className={styles.grid}>
        {ORDER.map((d) => (
          <Button
            key={d}
            testId={`diff-${d}`}
            label={L.diffLabels[d]}
            description={L.diffDesc[d]}
            variant="primary"
            active={d === current}
            onClick={() => onPick(d)}
          />
        ))}
      </div>
      <p className={styles.hint}>{L.diffHint[current]}</p>
    </div>
  );
}
