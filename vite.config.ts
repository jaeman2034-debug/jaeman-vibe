// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 5173,
    strictPort: false,
    proxy: { '/api/telemetry': 'http://127.0.0.1:3000' }
  },
  plugins: [react()]
});
