import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/main.tsx (StartOverlay 제거됨)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import './index.css'; // ★ 이 줄이 꼭 있어야 Tailwind가 먹습니다
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsxs(ErrorBoundary, { children: [_jsx(App, {}), _jsx(Toaster, { position: "top-right" })] }) }));
