import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  // Ionic uses Lit's browser wrapper; its Node entry intentionally omits events.
  resolve: {
    alias: {
      '@lit/react': fileURLToPath(
        new URL('./node_modules/@lit/react/development/index.js', import.meta.url)
      )
    }
  },
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'jsdom',
    setupFiles: './src/testSetup.ts',
    globals: true,
    restoreMocks: true,
    include: ['src/**/*.test.{ts,tsx}'],
    server: { deps: { inline: ['@ionic/react', '@stencil/react-output-target', '@lit/react'] } }
  }
});
