import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/__tests__/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/game/layout.ts',
        'src/game/i18n.ts',
        'src/game/settings.ts',
      ],
    },
  },
});