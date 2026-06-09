import { Button } from '@ui/Button';
import { cx } from '@ui/cx';
import { QUEST_BY_ID } from '@state/quests';
import { claimQuest, rerollWithAd } from '@state/tasksController';
import type { QuestSlot } from '@state/progress';
import type { Locale } from '../../../game/i18n';
import styles from './QuestRow.module.scss';

export function QuestRow({ slot, index, L }: { slot: QuestSlot; index: number; L: Locale }) {
  const def = QUEST_BY_ID[slot.id];
  if (!def) return null;
  const done = slot.progress >= def.target;
  const pct = Math.min(100, (slot.progress / def.target) * 100);
  return (
    <div className={cx(styles.root, slot.claimed && styles.claimed)} data-testid={`quest-${slot.id}`}>
      <div className={styles.info}>
        <span className={styles.name}>{L.quests[def.nameKey]}</span>
        <div className={styles.bar}>
          <div className={styles.fill} style={{ width: `${pct}%` }} />
        </div>
        <span className={styles.count}>{slot.progress} / {def.target}</span>
      </div>
      <div className={styles.control}>
        {slot.claimed
          ? <span className={styles.state}>{L.taskClaimed}</span>
          : done
            ? <Button type="primary" size="small" onClick={() => claimQuest(slot.id)}>{`${L.taskClaim} ${def.reward} 🦪`}</Button>
            : <Button type="secondary" size="small" onClick={() => rerollWithAd(index)}>↻</Button>}
      </div>
    </div>
  );
}
