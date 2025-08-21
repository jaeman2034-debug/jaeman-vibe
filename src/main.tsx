// src/main.tsx
import "./crash-shield";
import "./index.css"; // ← 반드시 추가
import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { RootErrorBoundary } from "./app/RootErrorBoundary";
import AppSplash from "./components/AppSplash";
import GlobalErrorOverlay from "./app/GlobalErrorOverlay";
import { ModalProvider } from "./components/ModalHost";
import { ThemeProvider } from "./components/theme/ThemeProvider";

// 지연 로딩으로 번들 최적화
const VoiceDebugPanel = lazy(() => import("./features/voice/VoiceDebugPanel"));
const PTTTestPage = lazy(() => import("./pages/PTTTestPage"));
const OneShotVoiceSignup = lazy(() => import("./components/OneShotVoiceSignup"));

// 새로운 음성 명령 모달들
const ProductCaptureModal = lazy(() => import("./pages/voice/modals/ProductCaptureModal"));
const ProductQuickRegisterModal = lazy(() => import("./pages/voice/modals/ProductQuickRegisterModal"));
const ProductAnalyzeModal = lazy(() => import("./pages/voice/modals/ProductAnalyzeModal"));

import { withClosable } from "./utils/withClosable";

const registry = {
  "voice:vad": (props: any) => (
    <Suspense fallback={<AppSplash small/>}>
      {withClosable(VoiceDebugPanel)(props)}
    </Suspense>
  ),
  "voice:asr": (props: any) => (
    <Suspense fallback={<AppSplash small/>}>
      {withClosable(PTTTestPage)(props)}
    </Suspense>
  ),
  "voice:signup": (props: any) => (
    <Suspense fallback={<AppSplash small/>}>
      {withClosable(OneShotVoiceSignup)(props)}
    </Suspense>
  ),
  // 새로운 음성 명령 모달들
  "voice:capture": (props: any) => (
    <Suspense fallback={<AppSplash small/>}>
      {withClosable(ProductCaptureModal)(props)}
    </Suspense>
  ),
  "voice:register": (props: any) => (
    <Suspense fallback={<AppSplash small/>}>
      {withClosable(ProductQuickRegisterModal)(props)}
    </Suspense>
  ),
  "voice:analyze": (props: any) => (
    <Suspense fallback={<AppSplash small/>}>
      {withClosable(ProductAnalyzeModal)(props)}
    </Suspense>
  ),
} as const;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <ThemeProvider>
        <ModalProvider registry={registry}>
          <App />
          <GlobalErrorOverlay />
        </ModalProvider>
      </ThemeProvider>
    </RootErrorBoundary>
  </React.StrictMode>
);
