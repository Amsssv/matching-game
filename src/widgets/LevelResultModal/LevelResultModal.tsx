import { useUi } from '@hooks/useUiStore';
import { closeLevelResult, openIsland } from '@state/campaignController';
import { levelById } from '@state/campaign';
import { Button } from '@ui/Button';
import { LOCALES } from '../../game/i18n';
import styles from './LevelResultModal.module.scss';

export function LevelResultModal() {
  const res = useUi((s) => s.modal.levelResult);
  const lang = useUi((s) => s.menu.lang);
  if (!res) return null;
  const L = LOCALES[lang];
  const found = levelById(res.levelId);
  const biome = found?.chapter.biome;
  return (
    <div className={styles.backdrop} data-testid="level-result">
      <div className={styles.panel}>
        <h2 className={styles.title}>{res.won ? L.levelCleared : L.levelFailed}</h2>
        {res.won && (
          <div className={styles.stars} data-testid="level-result-stars">
            <span>{'★'.repeat(res.stars)}</span>
            <span className={styles.starDim}>{'☆'.repeat(3 - res.stars)}</span>
          </div>
        )}
        {res.pearls > 0 && <div className={styles.reward}>+{res.pearls} 🦪</div>}
        {res.xp > 0 && <div className={styles.reward}>+{res.xp} XP</div>}
        {res.skinUnlocked && <div className={styles.unlock}>{L.skinUnlocked}</div>}
        <Button testId="level-result-close" type="primary" size="large"
          onClick={() => { closeLevelResult(); if (biome) openIsland(biome); }}>
          {L.continue}
        </Button>
      </div>
    </div>
  );
}
