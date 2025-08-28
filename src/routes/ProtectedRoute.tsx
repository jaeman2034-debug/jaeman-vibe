import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 24 }}>로딩 중…</div>;
  if (!user) return <Navigate to="/start" replace />;
  return children;
}
