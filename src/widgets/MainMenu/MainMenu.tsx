import { useUi } from '@hooks/useUiStore';
import { bus } from '@state/eventBus';
import { LOCALES } from '../../game/i18n';
import { Title } from './Title';
import { Subtitle } from './Subtitle';
import { DifficultyPicker } from '@features/DifficultyPicker';
import { SoundToggle } from '@features/SoundToggle';
import { Button } from '@ui/Button';
import { LanguageFlags } from '@features/LanguageFlags';
import { PearlBalance } from '@features/PearlBalance';
import styles from './MainMenu.module.scss';

export function MainMenu() {
  const { difficulty, soundEnabled, lang } = useUi(s => s.menu);
  const L = LOCALES[lang];
  return (
    <div className={styles.root} data-testid="menu">
      <PearlBalance />
      <LanguageFlags current={lang} onPick={(l) => bus.emit('cmd:set-lang', { lang: l })} />
      <Title text={L.title} />
      <Subtitle text={L.subtitle} />
      <DifficultyPicker L={L} current={difficulty} onPick={(d) => bus.emit('cmd:set-difficulty', { difficulty: d })} />
      <div className={styles.actions}>
        <Button testId="play" type="primary" size="large" active onClick={() => bus.emit('cmd:play')}>{L.play}</Button>
        <SoundToggle L={L} enabled={soundEnabled} onToggle={() => bus.emit('cmd:toggle-sound')} />
        <Button testId="leaderboard-open" type="secondary" size="small" onClick={() => bus.emit('cmd:open-leaderboard', { source: 'menu' })}>{`🏆 ${L.leaderboard}`}</Button>
      </div>
    </div>
  );
}
