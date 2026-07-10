import { useEffect, useRef } from 'react';
import { useUi } from '@hooks/useUiStore';
import { useProgress } from '@hooks/useProgress';
import { useMediaQuery } from '@hooks/useMediaQuery';
import { bus } from '@state/eventBus';
import { LOCALES } from '../../game/i18n';
import { CHAPTERS, isChapterUnlocked, isChapterComplete, chapterStars } from '@state/campaign';
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
import styles from './CampaignMap.module.scss';

/** Inline lock glyph for locked island badges (prototype uses a linear icon, not an emoji). */
function LockIcon() {
  return (
    <svg className={styles.lockIcon} viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  );
}

/** Transparent overlay over the CampaignScene canvas (which draws the world-map
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
            <img className={styles.mapImg} src={`${import.meta.env.BASE_URL}assets/campaign/world-map-mobile.webp`} alt="" aria-hidden="true" />
            {CHAPTERS.map((ch) => renderNode(ch, ch.mobilePosition))}
          </div>
        </div>
      ) : (
        CHAPTERS.map((ch) => renderNode(ch, ch.worldPosition))
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
