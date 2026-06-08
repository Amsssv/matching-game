import { useUi } from '../../hooks/useUiStore';
import { bus } from '../../../state/eventBus';
import { LOCALES } from '../../../game/i18n';
import { Button } from '../Button';
import styles from './Header.module.scss';

export function Header() {
  const { timer, moves, pairs } = useUi(s => s.hud);
  const lang = useUi(s => s.menu.lang);
  const L = LOCALES[lang];
  return (
    <header className={styles.header} data-testid="hud">
      <span className={styles.moves} data-testid="hud-moves">{moves}</span>
      <span className={styles.timer} data-testid="hud-timer">{timer}</span>
      <span className={styles.right}>
        <span className={styles.pairs} data-testid="hud-pairs">{pairs}</span>
        <Button
          testId="hud-menu"
          className={styles.menuButton}
          label={L.menu}
          variant="ghost"
          width={52}
          height={30}
          fontSize={10}
          onClick={() => bus.emit('cmd:exit-to-menu')}
        />
      </span>
    </header>
  );
}
