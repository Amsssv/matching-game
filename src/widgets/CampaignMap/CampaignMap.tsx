import { useUi } from '@hooks/useUiStore';
import { useProgress } from '@hooks/useProgress';
import { CHAPTERS, isChapterUnlocked, chapterStars } from '@state/campaign';
import { openIsland, closeCampaignMap } from '@state/campaignController';
import { LOCALES } from '../../game/i18n';
import styles from './CampaignMap.module.scss';

export function CampaignMap() {
  const open = useUi((s) => s.modal.campaignMap);
  const campaign = useProgress((p) => p.campaign);
  const lang = useUi((s) => s.menu.lang);
  if (!open) return null;
  const L = LOCALES[lang];
  return (
    <div className={styles.backdrop} data-testid="campaign-map">
      <button className={styles.close} onClick={closeCampaignMap} data-testid="campaign-map-close">✕</button>
      <div className={styles.mapWrap}>
        <img className={styles.mapImg} src="/assets/campaign/world-map.png" alt={L.journeyTitle} draggable={false} />
        {CHAPTERS.map((ch) => {
          const unlocked = isChapterUnlocked(ch.biome, campaign);
          const stars = chapterStars(ch.biome, campaign);
          const max = ch.levels.length * 3;
          return (
            <button
              key={ch.biome}
              className={`${styles.node} ${unlocked ? '' : styles.locked}`}
              style={{ left: `${ch.worldPosition.x}%`, top: `${ch.worldPosition.y}%` }}
              disabled={!unlocked}
              data-testid={`chapter-${ch.biome}`}
              onClick={() => unlocked && openIsland(ch.biome)}
            >
              {unlocked ? `⭐ ${stars}/${max}` : '🔒'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
