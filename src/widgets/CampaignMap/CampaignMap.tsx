import { useEffect, useRef, type CSSProperties } from 'react';
import { useUi } from '@hooks/useUiStore';
import { useProgress } from '@hooks/useProgress';
import { useMediaQuery } from '@hooks/useMediaQuery';
import { bus } from '@state/eventBus';
import { LOCALES } from '../../game/i18n';
import { CHAPTERS, isChapterUnlocked, isChapterComplete, chapterStars, type BiomeId } from '@state/campaign';
import { openIsland, exitCampaign } from '@state/campaignController';
import { PearlBalance } from '@features/PearlBalance';
import { EnergyMeter } from '@features/EnergyMeter';
import { ProfileButton } from '@features/ProfileButton';
import { StoreButton } from '@features/StoreButton';
import { DailyButton } from '@features/DailyButton';
import { TasksButton } from '@features/TasksButton';
import { HelpButton } from '@features/HelpButton';
import { SoundToggle } from '@features/SoundToggle';
import { LanguageSelect } from '@features/LanguageSelect';
import { Button } from '@ui/Button';
import { cx } from '@ui/cx';
import { DESKTOP_DECALS, MOBILE_DECALS, type Decal } from './decals';
import styles from './CampaignMap.module.scss';

// The whole journey map is composed from separate runtime layers (no baked composite):
// the ocean background (journey_bg.webp desktop / journey_bg_mobile.webp mobile), then paths +
// decor (see decals.ts), then the 5 chapter islands below — each an <img> at its worldPosition/
// mobilePosition %. Island sizes: on desktop the background is stretched full-viewport, so an
// island gets BOTH width% and height% (--iw/--ih) + object-fit:fill so it distorts identically to
// the background → stays glued to the paths. On mobile the background is a natural-aspect <img>,
// so islands use width% + natural height.
const ISLAND_ART: Record<BiomeId, string> = {
  lagoon: 'assets/journey/journey_big_island/NormIsland_journey.webp',
  volcano: 'assets/journey/journey_big_island/Lava_journey.webp',
  reef: 'assets/journey/journey_big_island/Reef_journey.webp',
  arctic: 'assets/journey/journey_big_island/Arctic_journey.webp',
  abyss: 'assets/journey/journey_big_island/Abyss_journey.webp',
};
/** width/height as % of the map box: deskW/deskH = % of the stretched viewport, mobW = % of the portrait img. */
const ISLAND_SIZE: Record<BiomeId, { deskW: number; deskH: number; mobW: number }> = {
  lagoon: { deskW: 25, deskH: 36.1, mobW: 84 },
  volcano: { deskW: 30, deskH: 41.6, mobW: 80 },
  reef: { deskW: 30, deskH: 33.9, mobW: 80 },
  arctic: { deskW: 26, deskH: 34.1, mobW: 85 },
  abyss: { deskW: 26, deskH: 40.9, mobW: 80 },
};

/** Inline lock glyph for locked island badges (prototype uses a linear icon, not an emoji). */
function LockIcon() {
  return (
    <svg className={styles.lockIcon} viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  );
}

/** Transparent overlay over the CampaignScene canvas (which draws the ocean
 * background). Renders the translucent top/bottom chrome + the interactive
 * chapter (island) nodes, styled to match the approved journey prototype. */
export function CampaignMap() {
  const campaign = useProgress((p) => p.campaign);
  const { lang, soundEnabled } = useUi((s) => s.menu);
  const L = LOCALES[lang];

  // The player's "current" world: first unlocked chapter that isn't fully cleared yet.
  const currentBiome =
    CHAPTERS.find((ch) => isChapterUnlocked(ch.biome, campaign) && !isChapterComplete(ch.biome, campaign))?.biome
    ?? null;

  // Mobile: the map is a vertical scroll of the portrait art; desktop keeps the
  // landscape canvas map with viewport-% nodes.
  const isMobile = useMediaQuery('(max-width: 700px)');
  const currentNodeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (isMobile) currentNodeRef.current?.scrollIntoView({ block: 'center' });
  }, [isMobile, currentBiome]);

  const renderNode = (ch: typeof CHAPTERS[number], pos: { x: number; y: number }) => {
    const unlocked = isChapterUnlocked(ch.biome, campaign);
    const stars = chapterStars(ch.biome, campaign);
    const max = ch.levels.length * 3;
    const isCurrent = unlocked && ch.biome === currentBiome;
    return (
      <button
        key={ch.biome}
        ref={isCurrent ? currentNodeRef : undefined}
        type="button"
        className={cx(styles.node, isCurrent && styles.current)}
        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        disabled={!unlocked}
        data-testid={`chapter-${ch.biome}`}
        onClick={() => { if (unlocked) openIsland(ch.biome); }}
      >
        <span className={styles.nodeInner}>
          <span className={styles.mName}>{L.biomeNames[ch.biome]}</span>
          <span className={cx(styles.badge, unlocked ? styles.badgeOpen : styles.badgeLocked)}>
            {unlocked ? (<>★ {stars}/{max}</>) : (<><LockIcon /><span className={styles.req}>{ch.starsToUnlock}★</span></>)}
          </span>
        </span>
      </button>
    );
  };

  // Decoration layer (paths + decor islands) under the chapter islands. Non-interactive;
  // z-index (decal 8 < island 15 < node 20) keeps them below islands regardless of DOM order.
  const renderDecal = (d: Decal, i: number) => {
    const vars: Record<string, string> = { '--iw': String(d.w) };
    if (d.h != null) vars['--ih'] = String(d.h);
    const style = { left: `${d.x}%`, top: `${d.y}%`, ...vars } as CSSProperties;
    return (
      <img
        key={`decal-${i}`}
        className={styles.decal}
        src={`${import.meta.env.BASE_URL}${d.art}`}
        style={style}
        alt=""
        aria-hidden="true"
      />
    );
  };

  // Independent island art layer, placed under its node (nodes stay the hit target).
  // Locked chapters render desaturated so lock state reads on the art itself.
  const renderIsland = (ch: typeof CHAPTERS[number], pos: { x: number; y: number }, mobile: boolean) => {
    const unlocked = isChapterUnlocked(ch.biome, campaign);
    const size = ISLAND_SIZE[ch.biome];
    const vars: Record<string, string> = { '--iw': String(mobile ? size.mobW : size.deskW) };
    if (!mobile) vars['--ih'] = String(size.deskH);
    const style = { left: `${pos.x}%`, top: `${pos.y}%`, ...vars } as CSSProperties;
    return (
      <img
        key={`island-${ch.biome}`}
        className={cx(styles.island, !unlocked && styles.islandLocked)}
        src={`${import.meta.env.BASE_URL}${ISLAND_ART[ch.biome]}`}
        style={style}
        alt=""
        aria-hidden="true"
      />
    );
  };

  return (
    <div className={styles.backdrop} data-testid="campaign-map">
      {isMobile ? (
        <>
          <header className={styles.mTop}>
            <div className={styles.mBar}>
              <div className={styles.mResources}>
                <PearlBalance />
                <EnergyMeter />
                <ProfileButton />
              </div>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label={L.menu}
                data-testid="campaign-map-close"
                onClick={exitCampaign}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className={styles.titleWrap}>
              <div className={styles.title}>{L.journeyTitle}</div>
              <div className={styles.subtitle}>{L.journeySubtitle}</div>
            </div>
          </header>
          <nav className={styles.mFeatureRail} aria-label={L.journeyTitle}>
            <StoreButton />
            <DailyButton />
            <TasksButton />
            <LanguageSelect current={lang} onPick={(l) => bus.emit('cmd:set-lang', { lang: l })} />
          </nav>
        </>
      ) : (
        <header className={styles.bar} data-bar="top">
          <div className={styles.cluster}>
            <PearlBalance />
            <EnergyMeter />
            <ProfileButton />
          </div>
          <div className={styles.titleWrap}>
            <div className={styles.title}>{L.journeyTitle}</div>
            <div className={styles.subtitle}>{L.journeySubtitle}</div>
          </div>
          <div className={styles.cluster}>
            <StoreButton />
            <DailyButton />
            <TasksButton />
            <LanguageSelect current={lang} onPick={(l) => bus.emit('cmd:set-lang', { lang: l })} />
            <button
              type="button"
              className={styles.iconBtn}
              aria-label={L.menu}
              data-testid="campaign-map-close"
              onClick={exitCampaign}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </header>
      )}

      {isMobile ? (
        <div className={styles.scroll}>
          <div className={styles.mapWrap}>
            <img className={styles.mapImg} src={`${import.meta.env.BASE_URL}assets/journey/journey_background/journey_bg_mobile.webp`} alt="" aria-hidden="true" />
            {/* Nodes render before islands so their :nth-child float stagger (below) is
                preserved; z-index (node 20 > island 15 > decal 8) drives painting, not DOM
                order, so decals come last without disturbing the node nth-child positions. */}
            {CHAPTERS.map((ch) => renderNode(ch, ch.mobilePosition))}
            {CHAPTERS.map((ch) => renderIsland(ch, ch.mobilePosition, true))}
            {MOBILE_DECALS.map(renderDecal)}
          </div>
        </div>
      ) : (
        <>
          {DESKTOP_DECALS.map(renderDecal)}
          {CHAPTERS.map((ch) => renderIsland(ch, ch.worldPosition, false))}
          {CHAPTERS.map((ch) => renderNode(ch, ch.worldPosition))}
        </>
      )}

      {isMobile ? (
        <footer className={styles.mBottom}>
          <Button testId="leaderboard-open" type="secondary" size="medium" onClick={() => bus.emit('cmd:open-leaderboard', { source: 'menu' })}>
            🏆 {L.leaderboard}
          </Button>
          <div className={styles.mUtil}>
            <HelpButton />
            <SoundToggle L={L} enabled={soundEnabled} onToggle={() => bus.emit('cmd:toggle-sound')} />
          </div>
        </footer>
      ) : (
        <footer className={styles.bar} data-bar="bottom">
          <div className={styles.cluster}>
            <Button testId="leaderboard-open" type="secondary" size="medium" onClick={() => bus.emit('cmd:open-leaderboard', { source: 'menu' })}>
              🏆 {L.leaderboard}
            </Button>
            <HelpButton />
          </div>
          <div className={styles.cluster}>
            <SoundToggle L={L} enabled={soundEnabled} onToggle={() => bus.emit('cmd:toggle-sound')} />
          </div>
        </footer>
      )}
    </div>
  );
}
