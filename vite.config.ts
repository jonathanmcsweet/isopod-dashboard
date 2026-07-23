import { join } from 'node:path';
import { defineConfig } from 'vite';

// Backend build: the extension entrypoint Podman Desktop loads with require().
// Built in SSR mode so node builtins resolve; output is a single CJS file
// (.cjs because this package is type: module).
export default defineConfig({
  build: {
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: false,
    ssr: join(import.meta.dirname, 'src', 'extension.ts'),
    target: 'node20',
    rollupOptions: {
      external: ['@podman-desktop/api'],
      output: {
        format: 'cjs',
        entryFileNames: 'extension.cjs',
      },
    },
  },
  ssr: {
    // Bundle everything except the externals above into extension.cjs.
    noExternal: true,
  },
});
