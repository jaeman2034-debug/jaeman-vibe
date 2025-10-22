import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";                 // ★ 이 줄 필수
import "./styles/tokens.css";         // 디자인 토큰
import 'maplibre-gl/dist/maplibre-gl.css';
import "./dev/consoleBridge";         // 개발용 콘솔 브릿지

// Sentry 초기화 (환경변수 기반)
import "./sentry";

// PWA Service Worker 등록
if ('serviceWorker' in navigator) {
  // 개발 중에는 SW 비활성화 (선택사항)
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW 등록 실패는 조용히 무시
      });
    });
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);