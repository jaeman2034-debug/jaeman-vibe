// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useModal } from './components/ModalHost';
import AuthProvider from './features/auth/AuthProvider';
import BottomTabs from './components/BottomTabs';
import DevBanner from './components/DevBanner';
import { VoiceUiBridgeMount } from './components/VoiceUiBridgeMount';
import DevErrorBoundary from './components/DevErrorBoundary';
import RequireAuth from './features/auth/RequireAuth';
import MarketCreate from './pages/market/MarketCreate';
import MarketList from './pages/market/MarketList';
import MarketDetail from './pages/market/MarketDetail';
import Nearby from './pages/market/Nearby';
import AIProductWorkflow from './pages/ai/AIProductWorkflow';

import StartScreen from './pages/StartScreen';
import Home from './pages/Home';
import Market from './pages/Market';
import MarketPage from './features/market/MarketPage';
import ProductDetailPage from './features/market/ProductDetailPage';
import Jobs from './pages/Jobs';
import Groups from './pages/Groups';
import My from './pages/My';

import Login from './pages/Login';
import Signup from './pages/Signup';
import ResetPassword from './pages/ResetPassword';
import PhoneSignup from './pages/PhoneSignup';
import PhoneVoiceSignup from './pages/PhoneVoiceSignup';
import MarketNew from './pages/MarketNew';
import VoiceTestPage from './pages/VoiceTestPage';
import PTTTestPage from './pages/PTTTestPage';
import OneShotVoiceSignup from './components/OneShotVoiceSignup';
import ProtectedRoute from './components/ProtectedRoute';
import RequireProfile from './routes/RequireProfile';
import OneShotVoiceSignupModern from './components/OneShotVoiceSignupModern';
import VoiceRoutes from './pages/voice/VoiceRoutes';
import DevGuard from './components/DevGuard';
import TestPage from './pages/TestPage';
import VoiceCommandTestPage from './pages/VoiceCommandTestPage';

// App.tsx 임시 - 빠른 스모크 테스트용
export default function App() {
  const { open } = useModal();

  // 전역 단축키 추가
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "v") {
        e.preventDefault();
        open("voice:vad");
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        open("voice:asr");
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        open("voice:signup");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // StartScreen을 띄우려면 아래 주석 해제
  return (
    <BrowserRouter>
      <DevErrorBoundary>
        <DevBanner />
        <AuthProvider>
          <VoiceUiBridgeMount />
          <Routes>
            <Route path="/" element={<StartScreen />} />
            <Route path="/home" element={<Home />} />
            <Route path="/market" element={<MarketList />} />
            
            {/* AI 상품 등록 워크플로우 */}
            <Route
              path="/ai/product"
              element={
                <RequireAuth>
                  <AIProductWorkflow />
                </RequireAuth>
              }
            />
            
            {/* 상품 등록: 여러 경로를 같은 페이지로 연결 */}
            <Route
              path="/market/new"
              element={
                <RequireAuth>
                  <MarketCreate />
                </RequireAuth>
              }
            />
            <Route path="/market/create" element={<Navigate to="/market/new" replace />} />
            <Route path="/market/register" element={<Navigate to="/market/new" replace />} />
            <Route path="/market/write" element={<Navigate to="/market/new" replace />} />
            
            {/* /sell도 동일 페이지로 연결 */}
            <Route
              path="/sell"
              element={
                <RequireAuth>
                  <MarketCreate />
                </RequireAuth>
              }
            />
            
            {/* 내 주변 상품 페이지 */}
            <Route path="/market/nearby" element={<Nearby />} />
            
            {/* 상품 상세 페이지 */}
            <Route path="/market/:id" element={<MarketDetail />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/my" element={<My />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/phone-signup" element={<PhoneSignup />} />
            <Route path="/phone-voice-signup" element={<PhoneVoiceSignup />} />
            <Route path="/market-new" element={<MarketNew />} />
            <Route path="/voice-test" element={<VoiceTestPage />} />
            <Route path="/ptt-test" element={<PTTTestPage />} />
            <Route path="/one-shot-voice" element={<OneShotVoiceSignup />} />
            <Route path="/one-shot-voice-modern" element={<OneShotVoiceSignupModern />} />
            <Route path="/one-shot-signup" element={<OneShotVoiceSignup />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/voice-command-test" element={<VoiceCommandTestPage />} />
            <Route
              path="/voice/*"
              element={
                <DevGuard>
                  <VoiceRoutes />
                </DevGuard>
              }
            />
            <Route path="/__ping" element={<div style={{padding:16}}>Router OK</div>} />
            <Route path="*" element={<div style={{padding:16}}>페이지를 찾을 수 없습니다.</div>} />
          </Routes>
        </AuthProvider>
      </DevErrorBoundary>
    </BrowserRouter>
  );
  
  // 또는 기존 컴포넌트 사용:
  // return <OneShotVoiceSignup />;
}
