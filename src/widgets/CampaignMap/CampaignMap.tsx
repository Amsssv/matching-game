import { useProgress } from '@hooks/useProgress';
import { CHAPTERS, isChapterUnlocked, chapterStars } from '@state/campaign';
import { openIsland, exitCampaign } from '@state/campaignController';
import { EnergyMeter } from '@features/EnergyMeter';
import styles from './CampaignMap.module.scss';

/** Transparent overlay over the CampaignScene canvas (which draws the world-map
 * background). Renders only the interactive chapter nodes + energy + exit. */
export function CampaignMap() {
  const campaign = useProgress((p) => p.campaign);
  return (
    <div className={styles.backdrop} data-testid="campaign-map">
      <div className={styles.energy}><EnergyMeter /></div>
      <button className={styles.close} onClick={exitCampaign} data-testid="campaign-map-close">✕</button>
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
  );
}
