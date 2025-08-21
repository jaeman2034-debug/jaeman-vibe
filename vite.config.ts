// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  server: {
    port: 5173,        // 항상 5173만 사용
    strictPort: true,  // 이미 점유면 실패(자동 포트 변경 금지)
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true }
    }
  },
  optimizeDeps: {
    force: true,       // 매번 의존성 최적화 강제(캐시 꼬임 방지)
  },
});
