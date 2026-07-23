import { join } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Frontend build: the webview page. Assets use relative paths; the extension
// rewrites them to webview URIs at panel creation time.
export default defineConfig({
  root: import.meta.dirname,
  base: './',
  plugins: [svelte(), tailwindcss()],
  build: {
    sourcemap: false,
    outDir: join(import.meta.dirname, '..', 'dist', 'webview'),
    emptyOutDir: true,
  },
});
