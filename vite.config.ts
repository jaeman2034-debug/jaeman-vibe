// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

function devHealthMock() {
  return {
    name: 'dev-health-mock',
    configureServer(server: any) {
      server.middlewares.use('/api/health', (_req: any, res: any) => {
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: true, mock: 'vite', ts: Date.now() }));
      });
    }
  };
}

export default defineConfig({
  plugins: [react()], // devHealthMock() 임시 모킹 비활성화
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    proxy: {
      '/api': { target: 'http://127.0.0.1:3000', changeOrigin: true, secure: false }
    }
  }
})
