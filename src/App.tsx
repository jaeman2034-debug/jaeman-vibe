// src/App.tsx
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import ProductDetail from './pages/ProductDetail';
import Nearby from './pages/market/Nearby';
import AIProductWorkflow from './pages/ai/AIProductWorkflow';
import SearchResultsPage from './pages/search/SearchResultsPage';
import FavoritesPage from './pages/favorites/FavoritesPage';
import MyItemsPage from './pages/market/MyItemsPage';

import StartScreen from './pages/StartScreen';
import Home from './pages/Home';
import Market from './pages/Market';
import MarketPage from './features/market/MarketPage';
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
import ProductTest from './pages/ProductTest';
import DevGeoPage from './pages/DevGeoPage';
import NewProductPage from './pages/products/NewProductPage';
import NearProductsPage from './pages/products/NearProductsPage';
import ProductDetailPage from './pages/products/ProductDetailPage';
import EditProductPage from './pages/products/EditProductPage';

// App.tsx 임시 - 빠른 스모크 테스트용
export default function App() {
  // 임시 ENV 확인 로그
  console.log('ENV check', {
    OPENAI: import.meta.env.VITE_OPENAI_API_KEY?.slice(0, 12) + '…',
    KAKAO:  import.meta.env.VITE_KAKAO_REST_KEY?.slice(0, 8) + '…'
  });

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
    <HashRouter>
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
            
            {/* 검색 결과 페이지 */}
            <Route path="/search" element={<SearchResultsPage />} />
            
            {/* 찜한 상품 페이지 */}
            <Route path="/favorites" element={<FavoritesPage />} />
            
            {/* 내 상품 관리 페이지 */}
            <Route path="/my-items" element={<MyItemsPage />} />
            
            {/* 상품 상세 페이지 */}
            <Route path="/market/:id" element={<ProductDetail />} />
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
            <Route path="/test" element={<ProductTest />} />
            <Route path="/voice-command-test" element={<VoiceCommandTestPage />} />
            <Route path="/dev/geo" element={<DevGeoPage />} />
            <Route path="/products/new" element={<NewProductPage />} />
            <Route path="/products/near" element={<NearProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/products/:id/edit" element={<EditProductPage />} />
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
    </HashRouter>
  );
  
  // 또는 기존 컴포넌트 사용:
  // return <OneShotVoiceSignup />;
}
