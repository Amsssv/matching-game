import { useUi } from '../../hooks/useUiStore';
import { bus } from '../../../state/eventBus';
import { LOCALES } from '../../../game/i18n';
import { Title } from '../Title';
import { Subtitle } from '../Subtitle';
import { DifficultyPicker } from '../DifficultyPicker';
import { SoundToggle } from '../SoundToggle';
import { PlayButton } from '../PlayButton';
import { LeaderboardButton } from '../LeaderboardButton';
import { LanguageFlags } from '../LanguageFlags';
import styles from './MainMenu.module.scss';

export function MainMenu() {
  const { difficulty, soundEnabled, lang } = useUi(s => s.menu);
  const L = LOCALES[lang];
  return (
    <div className={styles.root} data-testid="menu">
      <LanguageFlags current={lang} onPick={(l) => bus.emit('cmd:set-lang', { lang: l })} />
      <Title text={L.title} />
      <Subtitle text={L.subtitle} />
      <DifficultyPicker L={L} current={difficulty} onPick={(d) => bus.emit('cmd:set-difficulty', { difficulty: d })} />
      <div className={styles.actions}>
        <PlayButton label={L.play} onClick={() => bus.emit('cmd:play')} />
        <SoundToggle L={L} enabled={soundEnabled} onToggle={() => bus.emit('cmd:toggle-sound')} />
        <LeaderboardButton label={L.leaderboard} onClick={() => bus.emit('cmd:open-leaderboard', { source: 'menu' })} />
      </div>
    </div>
  );
}
