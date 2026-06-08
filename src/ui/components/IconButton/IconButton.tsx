import { cx } from '../../cx';
import styles from './IconButton.module.scss';

export interface IconButtonProps {
  label: string;
  onClick: (() => void) | null;  // null = current/active, non-interactive
  active: boolean;
  testId?: string;
}

export function IconButton({ label, onClick, active, testId }: IconButtonProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={active || !onClick}
      className={cx(styles.iconButton, active && styles.active)}
      onClick={() => onClick?.()}
    >
      {label.toUpperCase()}
    </button>
  );
}
