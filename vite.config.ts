// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const CF = 'https://us-central1-jaeman-vibe-platform.cloudfunctions.net'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5183,
    strictPort: true,
    proxy: {
      // 네이버 API 프록시 설정
      '^/api/naver/login': {
        target: CF,
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/naver/login', '/naverLogin'),
      },
      '^/api/naver/callback': {
        target: CF,
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/naver/callback', '/naverCallback'),
      },
      '^/api/naver/categories': {
        target: CF,
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/naver/categories', '/naverCategories'),
      },
      '^/api/naver/post': {
        target: CF,
        changeOrigin: true,
        rewrite: (path) => path.replace('/api/naver/post', '/naverPost'),
      },
    },
  },
})