import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['__tests__/**/*.test.ts'],
    environment: 'node',
    pool: 'forks',
    poolOptions: { forks: { maxForks: process.env.CI ? 1 : 2 } },
    testTimeout: 30000,
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts'],
      reporter: ['text', 'lcov'],
    },
    setupFiles: ['__tests__/setup.ts'],
  },
});
