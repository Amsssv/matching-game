import { IconButton } from '../IconButton';
import styles from './LanguageFlags.module.scss';
import { SUPPORTED } from '../../../game/settings';
import type { Lang } from '../../../game/i18n';

export function LanguageFlags({ current, onPick }: { current: Lang; onPick: (l: Lang) => void }) {
  return (
    <div className={styles.root} data-testid="langs">
      {SUPPORTED.map((lng) => (
        <IconButton
          key={lng}
          testId={`lang-${lng}`}
          label={lng}
          active={lng === current}
          onClick={lng === current ? null : () => onPick(lng)}
        />
      ))}
    </div>
  );
}
