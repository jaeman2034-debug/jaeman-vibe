import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/features/auth/AuthContext';
import ProtectedRoute from '@/routes/ProtectedRoute';
import StartScreen from '@/features/start/StartScreen';
import VoicePage from '@/pages/VoicePage';
import AppShell from '@/components/AppShell';
import Market from '@/pages/Market';
import WhyPage from '@/features/why/WhyPage';
import ProductDetail from '@/features/market/detail/ProductDetail';
import ProductCreate from '@/features/market/edit/ProductCreate';
import GroupsList from '@/features/groups/GroupsList';
import GroupDetail from '@/features/groups/GroupDetail';
import GroupCreate from '@/features/groups/GroupCreate';
import JobsList from '@/features/jobs/JobsList';
import JobDetail from '@/features/jobs/JobDetail';
import JobCreate from '@/features/jobs/JobCreate';
import AdminTools from '@/admin/AdminTools';
import Dashboard from '@/admin/Dashboard';
import { VoiceProvider } from '@/voice/VoiceContext';
import VoiceMic from '@/voice/VoiceMic';
import { installGlobalErrorHooks, installDiagAPI } from '@/diag/globals';

export default function App() {
  useEffect(() => {
    installGlobalErrorHooks();
    installDiagAPI();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <VoiceProvider>
          <Routes>
            {/* ⬇ StartScreen은 공용 레이아웃 없이 단독 렌더링 */}
            <Route path="/start" element={<StartScreen />} />
            <Route path="/voice" element={<VoicePage />} />

            {/* ⬇ 나머지 페이지들은 AppShell 레이아웃 안에서 */}
            <Route element={<AppShell />}>
              <Route path="/" element={<Navigate to="/start" replace />} />
              <Route path="/market" element={<Market />} />
              <Route path="/why" element={<WhyPage />} />
              <Route path="/product/new" element={
                <ProtectedRoute><ProductCreate /></ProtectedRoute>
              } />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/groups" element={<GroupsList />} />
              <Route path="/groups/new" element={
                <ProtectedRoute><GroupCreate /></ProtectedRoute>
              } />
              <Route path="/groups/:id" element={<GroupDetail />} />
              <Route path="/jobs" element={<JobsList />} />
              <Route path="/jobs/new" element={
                <ProtectedRoute><JobCreate /></ProtectedRoute>
              } />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="/admin/tools" element={
                <ProtectedRoute><AdminTools /></ProtectedRoute>
              } />
              <Route path="/admin/dashboard" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              } />
            </Route>

            {/* ⬇ 404 처리 */}
            <Route path="*" element={<Navigate to="/start" replace />} />
          </Routes>

          {/* ⬇ 전역 음성 마이크 (StartScreen에서는 CSS로 숨김) */}
          <VoiceMic />
          
          {/* ⬇ 전역 토스트 */}
          <Toaster position="top-right" />
        </VoiceProvider>
      </Router>
    </AuthProvider>
  );
}