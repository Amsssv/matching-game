import { useUi } from '@hooks/useUiStore';
import { useProgress } from '@hooks/useProgress';
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

  return (
    <div className={styles.backdrop} data-testid="campaign-map">
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

      {CHAPTERS.map((ch) => {
        const unlocked = isChapterUnlocked(ch.biome, campaign);
        const stars = chapterStars(ch.biome, campaign);
        const max = ch.levels.length * 3;
        const isCurrent = unlocked && ch.biome === currentBiome;
        return (
          <button
            key={ch.biome}
            type="button"
            className={cx(styles.node, isCurrent && styles.current)}
            style={{ left: `${ch.worldPosition.x}%`, top: `${ch.worldPosition.y}%` }}
            disabled={!unlocked}
            data-testid={`chapter-${ch.biome}`}
            onClick={() => { if (unlocked) openIsland(ch.biome); }}
          >
            <span className={cx(styles.badge, unlocked ? styles.badgeOpen : styles.badgeLocked)}>
              {unlocked ? (
                <>★ {stars}/{max}</>
              ) : (
                <><LockIcon /><span className={styles.req}>{ch.starsToUnlock}★</span></>
              )}
            </span>
          </button>
        );
      })}

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
    </div>
  );
}
