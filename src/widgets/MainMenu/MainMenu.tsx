import { useUi } from '@hooks/useUiStore';
import { bus } from '@state/eventBus';
import { openShop } from '@state/shopController';
import { LOCALES } from '../../game/i18n';
import { Title } from './Title';
import { Subtitle } from './Subtitle';
import { DifficultyPicker } from '@features/DifficultyPicker';
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
  const { difficulty, soundEnabled, lang } = useUi(s => s.menu);
  const L = LOCALES[lang];
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
          <DifficultyPicker L={L} current={difficulty} onPick={(d) => bus.emit('cmd:set-difficulty', { difficulty: d })} />
          <Button testId="play" type="primary" size="large" className={styles.play} onClick={() => bus.emit('cmd:play')}>
            <svg className={styles.playIcon} viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
            {L.play}
          </Button>
        </div>
      </main>

      <footer className={styles.bottomBar} data-testid="menu-footer">
        <div className={styles.bottomActions}>
          <Button testId="leaderboard-open" type="secondary" size="medium" className={styles.records} onClick={() => bus.emit('cmd:open-leaderboard', { source: 'menu' })}>{`🏆 ${L.leaderboard}`}</Button>
          <Button testId="shop-open" type="secondary" size="medium" onClick={() => openShop()}>
            <span className={styles.iconLabel}>
              <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                <rect x="4" y="7" width="12" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth={1.8} />
                <path d="M8 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {L.shop}
            </span>
          </Button>
          <HelpButton />
        </div>
        <SoundToggle L={L} enabled={soundEnabled} onToggle={() => bus.emit('cmd:toggle-sound')} />
      </footer>
    </div>
  );
}
