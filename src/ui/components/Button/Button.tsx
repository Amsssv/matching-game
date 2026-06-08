import type { ReactNode } from 'react';
import { cx } from '../../cx';
import styles from './Button.module.scss';

export type ButtonType = 'primary' | 'secondary';
export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonShape = 'default' | 'icon';

export interface ButtonProps {
  children?: ReactNode;
  onClick?: () => void;
  type?: ButtonType;
  size?: ButtonSize;
  shape?: ButtonShape;
  block?: boolean;
  active?: boolean;
  disabled?: boolean;
  className?: string;
  testId?: string;
}

const SIZE_CLASS: Record<ButtonSize, string> = {
  small: styles.small, medium: styles.medium, large: styles.large,
};

export function Button({
  children, onClick, type = 'secondary', size = 'large', shape = 'default',
  block = false, active = false, disabled, className = '', testId,
}: ButtonProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      className={cx(
        styles.button,
        styles[type],
        shape === 'icon' ? styles.icon : SIZE_CLASS[size],
        block && styles.block,
        active && styles.active,
        className,
      )}
      onClick={() => { if (!disabled) onClick?.(); }}
    >
      {children}
    </button>
  );
}
