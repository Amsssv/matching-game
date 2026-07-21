import { useUi } from '@hooks/useUiStore';
import { useProgress } from '@hooks/useProgress';
import { useMediaQuery } from '@hooks/useMediaQuery';
import { CHAPTERS, chapterStars, isLevelUnlocked, type BiomeId, type CampaignLevel } from '@state/campaign';
import { openLevelStart, closeIsland } from '@state/campaignController';
import { cx } from '@ui/cx';
import { LOCALES } from '../../game/i18n';
import { mobileNodeLayout, pebbleDots } from './levelTrail';
import styles from './IslandView.module.scss';

// Paths are BASE_URL-relative (no leading slash): vite `base: './'` means an
// absolute `/assets/…` resolves against the origin root, which 404s on the
// nested Yandex Games host — mirror CampaignMap and prefix `import.meta.env.BASE_URL`.
const B = import.meta.env.BASE_URL;
const ART: Record<BiomeId, string> = {
  lagoon: `${B}assets/skins/Lagoon/Lagoon-iland.webp`,
  reef: `${B}assets/skins/Reef/Reef-iland.webp`,
  arctic: `${B}assets/skins/Arctic/Arctic-iland.webp`,
  volcano: `${B}assets/skins/Lava/Lava-iland.webp`,
  abyss: `${B}assets/skins/Abyss/Abyss-iland.webp`,
};

// Portrait island boards for the tall mobile modal (sandy tablets sized for a
// vertical level trail); desktop uses the landscape art above.
const ART_MOBILE: Record<BiomeId, string> = {
  lagoon: `${B}assets/skins/Lagoon/Lagoon-iland-mobile.webp`,
  reef: `${B}assets/skins/Reef/Reef-iland-mobile.webp`,
  arctic: `${B}assets/skins/Arctic/Arctic-iland-mobile.webp`,
  volcano: `${B}assets/skins/Lava/Lava-iland-mobile.webp`,
  abyss: `${B}assets/skins/Abyss/Abyss-iland-mobile.webp`,
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
 * showing the biome's island art and the chapter's 12 level nodes. Desktop keeps the
 * 4×3 grid; mobile (≤700px) lays the nodes out along a serpentine pebble trail with
 * outlined stars, a gold "PLAY" pill on the current level, an art-darkening gradient and
 * a hint line — matching the approved journey prototype (Screen 2). */
export function IslandView() {
  const biome = useUi((s) => s.modal.island);
  const campaign = useProgress((p) => p.campaign);
  const lang = useUi((s) => s.menu.lang);
  const isMobile = useMediaQuery('(max-width: 700px)');
  if (!biome) return null;
  const L = LOCALES[lang];
  const ch = CHAPTERS.find((c) => c.biome === biome)!;
  const stars = chapterStars(biome, campaign);
  const max = ch.levels.length * 3;

  const stateOf = (lvl: CampaignLevel): NodeState => {
    if (campaign.cleared.includes(lvl.id)) return 'passed';
    return isLevelUnlocked(lvl.id, campaign) ? 'current' : 'locked';
  };
  const starsOf = (lvl: CampaignLevel) =>
    campaign.cleared.includes(lvl.id) ? (campaign.stars[lvl.id] ?? 0) : 0;

  const stageStyle = { backgroundImage: `url(${isMobile ? ART_MOBILE[biome] : ART[biome]})` };

  const layout = mobileNodeLayout();
  const pebbles = pebbleDots(layout);
  const currentLevel = ch.levels.find(
    (lvl) => isLevelUnlocked(lvl.id, campaign) && !campaign.cleared.includes(lvl.id),
  );
  const hint = currentLevel ? L.levelHint.replace('{n}', String(currentLevel.index)) : L.levelHintDone;

  const stars3 = (filled: number) => (
    <span className={styles.lvlstars}>
      {[0, 1, 2].map((i) => (<StarIcon key={i} filled={i < filled} />))}
    </span>
  );

  const body = isMobile ? (
    <div className={cx(styles.stage, styles.mStage)} style={stageStyle}>
      <div className={styles.mOverlay} aria-hidden />
      {pebbles.map((d, i) => (
        <span key={i} className={styles.pebble} style={{ left: `${d.x}%`, top: `${d.y}%` }} aria-hidden />
      ))}
      {ch.levels.map((lvl, i) => {
        const state = stateOf(lvl);
        const pos = layout[i];
        return (
          <button
            key={lvl.id}
            type="button"
            className={cx(styles.node, styles.mNode, styles[state])}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            disabled={state === 'locked'}
            data-testid={`level-${lvl.id}`}
            onClick={() => state !== 'locked' && openLevelStart(lvl.id)}
          >
            <span className={styles.disc}>{state === 'locked' ? <LockIcon /> : lvl.index}</span>
            {stars3(starsOf(lvl))}
          </button>
        );
      })}
    </div>
  ) : (
    <div className={styles.stage} style={stageStyle}>
      <div className={styles.grid}>
        {ch.levels.map((lvl) => {
          const state = stateOf(lvl);
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
              {stars3(starsOf(lvl))}
            </button>
          );
        })}
      </div>
    </div>
  );

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
        {body}
        {isMobile && (
          <div className={styles.mHint}><span className={styles.hintDot} aria-hidden />{hint}</div>
        )}
      </div>
    </div>
  );
}
