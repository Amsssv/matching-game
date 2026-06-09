/** Join class names, dropping falsy values. No dependency; replaces clsx/classnames. */
export const cx = (...parts: (string | false | null | undefined)[]): string =>
  parts.filter(Boolean).join(' ');
