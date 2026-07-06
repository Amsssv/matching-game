import { useEffect } from 'react';
import { useUi } from '@hooks/useUiStore';
import { bus } from '@state/eventBus';
import { openShop } from '@state/shopController';
import { maybeShowLevelUp } from '@state/levelUpController';
import { LOCALES } from '../../game/i18n';
import { Title } from './Title';
import { Subtitle } from './Subtitle';
import { ModePicker } from '@features/ModePicker';
import { openModeStart } from '@state/modeStartController';
import { useProgress } from '@hooks/useProgress';
import { SoundToggle } from '@features/SoundToggle';
import { Button } from '@ui/Button';
import { LanguageSelect } from '@features/LanguageSelect';
import { PearlBalance } from '@features/PearlBalance';
import { StoreButton } from '@features/StoreButton';
import { DailyButton } from '@features/DailyButton';
import { TasksButton } from '@features/TasksButton';
import { ProfileButton } from '@features/ProfileButton';
import { HelpButton } from '@features/HelpButton';
import styles from './MainMenu.module.scss';

export function MainMenu() {
  const { soundEnabled, lang } = useUi(s => s.menu);
  const xp = useProgress((s) => s.stats.xp);
  const L = LOCALES[lang];
  // Entering the menu = MainMenu mounts. Celebrate any unacknowledged level-up.
  useEffect(() => { maybeShowLevelUp(); }, []);
  return (
    <div className={styles.root} data-testid="menu">
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          <PearlBalance />
          <StoreButton />
          <DailyButton />
          <TasksButton />
          <ProfileButton />
        </div>
        <LanguageSelect current={lang} onPick={(l) => bus.emit('cmd:set-lang', { lang: l })} />
      </header>

      <main className={styles.center}>
        <div className={styles.centerInner}>
          <Title text={L.title} />
          <Subtitle text={L.subtitle} />
          <ModePicker L={L} xp={xp} onPick={openModeStart} />
        </div>
      </main>

      <footer className={styles.bottomBar} data-testid="menu-footer">
        <div className={styles.bottomActions}>
          <Button testId="leaderboard-open" type="secondary" size="medium" className={styles.records} onClick={() => bus.emit('cmd:open-leaderboard', { source: 'menu' })}>
            <span className={styles.iconLabel}>🏆<span className={styles.btnLabel}>{L.leaderboard}</span></span>
          </Button>
          <Button testId="shop-open" type="secondary" size="medium" onClick={() => openShop()}>
            <span className={styles.iconLabel}>
              <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                <rect x="4" y="7" width="12" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth={1.8} />
                <path d="M8 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className={styles.btnLabel}>{L.shop}</span>
            </span>
          </Button>
          <HelpButton />
          <SoundToggle L={L} enabled={soundEnabled} onToggle={() => bus.emit('cmd:toggle-sound')} className={styles.soundAction} />
        </div>
      </footer>
    </div>
  );
}
