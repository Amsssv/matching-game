import { Button } from '@ui/Button';
import { cx } from '@ui/cx';
import { claimAchievement } from '@state/tasksController';
import type { AchievementDef } from '@state/achievements';
import type { Locale } from '../../../game/i18n';
import styles from './AchievementRow.module.scss';

export function AchievementRow({ def, done, claimed, L }: { def: AchievementDef; done: boolean; claimed: boolean; L: Locale }) {
  const locked = !done && !claimed;
  return (
    <div className={cx(styles.root, locked && styles.locked)} data-testid={`ach-${def.id}`}>
      <div className={styles.info}>
        <span className={styles.name}>{L.achievements[def.nameKey]}</span>
        <span className={styles.reward}>{`${def.reward} 🦪`}</span>
      </div>
      <div className={styles.control}>
        {claimed
          ? <span className={styles.state}>{L.taskClaimed}</span>
          : done
            ? <Button type="primary" size="small" onClick={() => claimAchievement(def.id)}>{L.taskClaim}</Button>
            : null}
      </div>
    </div>
  );
}
