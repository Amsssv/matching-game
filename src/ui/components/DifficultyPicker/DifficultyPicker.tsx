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
            type="primary"
            size="medium"
            active={d === current}
            onClick={() => onPick(d)}
          >
            <span>{L.diffLabels[d]}</span>
            <span className={styles.optionDesc}>{L.diffDesc[d]}</span>
          </Button>
        ))}
      </div>
      <p className={styles.hint}>{L.diffHint[current]}</p>
    </div>
  );
}
