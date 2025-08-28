// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

export default defineConfig({
  plugins: [react()],
  appType: 'spa',         // ★ 중요: SPA fallback 활성화
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    host: '127.0.0.1',   // LAN 노출 막으려면 권장
    port: 5175,          // 현재 포트 고정
    strictPort: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  // 혹시 예전에 MPA 설정이 있었다면 전부 제거!
  // build: { rollupOptions: { input: { ... } } }  같은 다중 페이지 설정이 있으면 지워주세요.
})
