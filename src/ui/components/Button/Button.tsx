import type { ReactNode } from 'react';
import { cx } from '../../cx';
import styles from './Button.module.scss';

export type ButtonVariant = 'primary' | 'ghost' | 'secondary';

export interface ButtonProps {
  label: ReactNode;
  onClick: () => void;
  variant?: ButtonVariant;
  active?: boolean;
  description?: string;
  className?: string;
  /** CSS px sizing when the layout fixes button dimensions */
  width?: number;
  height?: number;
  fontSize?: number;
  testId?: string;
  disabled?: boolean;
}

export function Button({
  label, onClick, variant = 'primary', active = false, description,
  className = '', width, height, fontSize, testId, disabled,
}: ButtonProps) {
  const style: React.CSSProperties & Record<string, string> = {};
  if (width != null) style['--button-width'] = `${width}px`;
  if (height != null) style['--button-height'] = `${height}px`;
  if (fontSize != null) style['--button-font-size'] = `${fontSize}px`;
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      className={cx(styles.button, styles[variant], active && styles.active, className)}
      style={style}
      onClick={() => { if (!disabled) onClick(); }}
    >
      <span className={styles.label}>{label}</span>
      {description && <span className={styles.description}>{description}</span>}
    </button>
  );
}
