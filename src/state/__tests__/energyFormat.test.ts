import { describe, it, expect } from 'vitest';
import { formatCountdown } from '../../features/EnergyMeter/format';

describe('formatCountdown', () => {
  it('formats mm:ss with zero-pad', () => {
    expect(formatCountdown(0)).toBe('0:00');
    expect(formatCountdown(65_000)).toBe('1:05');
    expect(formatCountdown(600_000)).toBe('10:00');
  });
});
