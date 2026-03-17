import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/__tests__/**/*.test.ts'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts'],
      reporter: ['text', 'lcov'],
    },
    testTimeout: 30000,
    clearMocks: true,
    restoreMocks: true,
    setupFiles: ['./__tests__/setup.ts'],
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 1,
      },
    },
    reporters: ['verbose'],
  },
});
