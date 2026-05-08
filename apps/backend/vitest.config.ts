import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    setupFiles: ['src/__tests__/setup/globalSetup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: '../../test-reports/backend-coverage',
      include: ['src/modules/**/*.service.ts', 'src/lib/**/*.ts'],
      exclude: ['src/__tests__/**', 'src/server.ts'],
      thresholds: {
        functions: 60,
        branches: 50,
        lines: 60,
      },
    },
    pool: 'forks',
    singleFork: true,
    testTimeout: 30000,
    sequence: { concurrent: false },
  },
});
