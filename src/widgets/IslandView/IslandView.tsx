import { useUi } from '@hooks/useUiStore';
import { useProgress } from '@hooks/useProgress';
import { CHAPTERS, chapterStars, isLevelUnlocked, type BiomeId } from '@state/campaign';
import { openLevelStart, closeIsland } from '@state/campaignController';
import { cx } from '@ui/cx';
import { LOCALES } from '../../game/i18n';
import styles from './IslandView.module.scss';

const ART: Record<BiomeId, string> = {
  lagoon: '/assets/iland.webp',
  reef: '/assets/skins/Reef/Reef-iland.webp',
  arctic: '/assets/skins/Arctic/Arctic-iland.webp',
  volcano: '/assets/skins/Lava/Lava-iland.webp',
  abyss: '/assets/skins/Abyss/Abyss-iland.webp',
};

/** Inline lock glyph shown on a locked level node's disc (mirrors CampaignMap's badge icon). */
function LockIcon() {
  return (
    <svg className={styles.lockIcon} viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

const STAR_PATH = 'M12 2.4l2.85 6.02 6.55.62-4.95 4.4 1.45 6.46L12 16.9 6.1 20.3l1.45-6.46-4.95-4.4 6.55-.62z';
/** Chunky star with a dark outline + drop-shadow so it reads on any island art. */
function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg className={cx(styles.star, filled ? styles.starOn : styles.starOff)} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d={STAR_PATH} />
    </svg>
  );
}

type NodeState = 'passed' | 'current' | 'locked';

/** Island / level-select modal: a dim scrim over the map with a centered dark panel
 * showing the biome's island art and a 4x3 grid of level nodes, styled to match
 * the approved journey prototype (Screen 2, `#levels` / `.island-modal`). */
export function IslandView() {
  const biome = useUi((s) => s.modal.island);
  const campaign = useProgress((p) => p.campaign);
  const lang = useUi((s) => s.menu.lang);
  if (!biome) return null;
  const L = LOCALES[lang];
  const ch = CHAPTERS.find((c) => c.biome === biome)!;
  const stars = chapterStars(biome, campaign);
  const max = ch.levels.length * 3;

  return (
    <div className={styles.backdrop} data-testid={`island-${biome}`}>
      <div className={styles.scrim} onClick={closeIsland} />
      <div className={styles.modal}>
        <div className={styles.head}>
          <button type="button" className={styles.back} onClick={closeIsland} data-testid="island-back">
            <BackIcon /> {L.mapBack}
          </button>
          <div className={styles.titles}>
            <div className={styles.worldTitle}>{L.biomeNames[biome]}</div>
            <div className={styles.progBadge}><span>★</span><span>{stars}/{max}</span></div>
          </div>
          <span />
        </div>
        <div className={styles.stage} style={{ backgroundImage: `url(${ART[biome]})` }}>
          <div className={styles.grid}>
            {ch.levels.map((lvl) => {
              const cleared = campaign.cleared.includes(lvl.id);
              const unlocked = isLevelUnlocked(lvl.id, campaign);
              const state: NodeState = cleared ? 'passed' : unlocked ? 'current' : 'locked';
              const filled = cleared ? (campaign.stars[lvl.id] ?? 0) : 0;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  className={cx(styles.node, styles[state])}
                  disabled={state === 'locked'}
                  data-testid={`level-${lvl.id}`}
                  onClick={() => state !== 'locked' && openLevelStart(lvl.id)}
                >
                  <span className={styles.disc}>{state === 'locked' ? <LockIcon /> : lvl.index}</span>
                  <span className={styles.lvlstars}>
                    {[0, 1, 2].map((i) => (
                      <StarIcon key={i} filled={i < filled} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
