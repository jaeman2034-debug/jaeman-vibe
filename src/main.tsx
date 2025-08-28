// src/main.tsx (StartOverlay 제거됨)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import './index.css'   // ★ 이 줄이 꼭 있어야 Tailwind가 먹습니다

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <Toaster position="top-right" />
    </ErrorBoundary>
  </React.StrictMode>
);