import { defineConfig } from 'vitest/config';
import { join } from 'node:path';

// Separate from vite.config.ts on purpose: the build config sets
// ssr.noExternal, which would make vitest inline its own runtime and break.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    alias: {
      // Types-only package; runtime is injected by Podman Desktop. Tests stub it.
      '@podman-desktop/api': join(import.meta.dirname, 'src', '__mocks__', 'podman-desktop-api.ts'),
    },
  },
});
