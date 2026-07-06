import { useState } from 'react';
import { useUi } from '@hooks/useUiStore';
import { useProgress } from '@hooks/useProgress';
import { levelById } from '@state/campaign';
import { regenEnergy } from '@state/energy';
import { startLevel, closeLevelStart, refillEnergyWithPearls, ENERGY_REFILL_COST } from '@state/campaignController';
import { Button } from '@ui/Button';
import { LOCALES } from '../../game/i18n';
import styles from './LevelStartSheet.module.scss';

export function LevelStartSheet() {
  const levelId = useUi((s) => s.modal.levelStart);
  const energy = useProgress((p) => p.energy);
  const lang = useUi((s) => s.menu.lang);
  const [now] = useState(() => Date.now());
  if (!levelId) return null;
  const found = levelById(levelId);
  if (!found) return null;
  const L = LOCALES[lang];
  const live = regenEnergy(energy, now);
  const canPlay = live.current > 0;
  const { level } = found;
  return (
    <div className={styles.backdrop} onClick={closeLevelStart} data-testid="level-start">
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{L.levelWord} {level.index}</h2>
        <ul className={styles.goals}>
          <li>⭐ {L.goalComplete}</li>
          {level.goals.maxMoves !== undefined && <li>⭐ {L.goalMoves.replace('{n}', String(level.goals.maxMoves))}</li>}
          {level.goals.maxSeconds !== undefined && <li>⭐ {L.goalTime.replace('{n}', String(level.goals.maxSeconds))}</li>}
        </ul>
        <div className={styles.cost}>❤ −1</div>
        {canPlay ? (
          <Button testId="level-play" type="primary" size="large" onClick={() => startLevel(levelId, Date.now())}>
            {L.play}
          </Button>
        ) : (
          <Button testId="level-refill" type="primary" size="large" onClick={() => refillEnergyWithPearls(Date.now())}>
            {L.refillFor.replace('{n}', String(ENERGY_REFILL_COST))} 🦪
          </Button>
        )}
      </div>
    </div>
  );
}
