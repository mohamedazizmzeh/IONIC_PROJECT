import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1', port: 4200, strictPort: true },
  build: {
    outDir: 'www',
    target: ['chrome107', 'firefox106', 'edge107', 'safari16.1', 'ios16.1']
  }
});
