import { Button } from '@ui/Button';
import styles from './SoundToggle.module.scss';
import type { Locale } from '../../../game/i18n';

export function SoundToggle({
  L, enabled, onToggle,
}: { L: Locale; enabled: boolean; onToggle: () => void }) {
  return (
    <div>
      <p className={styles.label}>{L.sound}</p>
      <Button
        testId="sound-toggle"
        type="primary"
        size="large"
        active={enabled}
        onClick={onToggle}
      >{enabled ? L.soundOn : L.soundOff}</Button>
    </div>
  );
}
