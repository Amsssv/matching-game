import { useUi } from '@hooks/useUiStore';
import { useProgress } from '@hooks/useProgress';
import { CHAPTERS, isLevelUnlocked, type BiomeId } from '@state/campaign';
import { openLevelStart, closeIsland } from '@state/campaignController';
import styles from './IslandView.module.scss';

const ART: Record<BiomeId, string> = {
  lagoon: '/assets/iland.webp',
  reef: '/assets/skins/Reef/Reef-iland.webp',
  arctic: '/assets/skins/Arctic/Arctic-iland.webp',
  volcano: '/assets/skins/Lava/Lava-iland.webp',
  abyss: '/assets/skins/Abyss/Abyss-iland.webp',
};

export function IslandView() {
  const biome = useUi((s) => s.modal.island);
  const campaign = useProgress((p) => p.campaign);
  if (!biome) return null;
  const ch = CHAPTERS.find((c) => c.biome === biome)!;
  return (
    <div className={styles.backdrop} data-testid={`island-${biome}`}>
      <button className={styles.back} onClick={closeIsland} data-testid="island-back">‹ карта</button>
      <div className={styles.islandWrap}>
        <img className={styles.islandImg} src={ART[biome]} alt={biome} draggable={false} />
        {ch.levels.map((lvl, i) => {
          const unlocked = isLevelUnlocked(lvl.id, campaign);
          const stars = campaign.stars[lvl.id] ?? 0;
          const pos = ch.nodePositions[i];
          return (
            <button
              key={lvl.id}
              className={`${styles.node} ${unlocked ? '' : styles.locked}`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              disabled={!unlocked}
              data-testid={`level-${lvl.id}`}
              onClick={() => unlocked && openLevelStart(lvl.id)}
            >
              <span className={styles.idx}>{unlocked ? lvl.index : '🔒'}</span>
              {unlocked && <span className={styles.stars}>{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
