import { defineConfig } from 'vitest/config';

// Only the pure parts of src/lib are tested here. Anything that reaches Discord or the
// service is exercised against a running service, not mocked into a shape that agrees
// with itself.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
