import { Button } from '@ui/Button';
import { cx } from '@ui/cx';
import { claimAchievement } from '@state/tasksController';
import type { AchievementDef } from '@state/achievements';
import type { Locale } from '../../../game/i18n';
import styles from './AchievementRow.module.scss';

export function AchievementRow({ def, done, claimed, progress, L }: { def: AchievementDef; done: boolean; claimed: boolean; progress: number; L: Locale }) {
  const locked = !done && !claimed;
  const shown = Math.min(progress, def.target);
  const pct = Math.min(100, (progress / def.target) * 100);
  return (
    <div className={cx(styles.root, locked && styles.locked)} data-testid={`ach-${def.id}`}>
      <div className={styles.info}>
        <span className={styles.name}>{L.achievements[def.nameKey]}</span>
        <div className={styles.bar}><div className={styles.fill} style={{ width: `${pct}%` }} /></div>
        <span className={styles.count}>{shown} / {def.target}<span className={styles.reward}> · {def.reward} 🦪</span></span>
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
