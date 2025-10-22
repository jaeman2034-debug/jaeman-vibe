// src/components/RequireAuth.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading, initializing } = useAuth();
  const location = useLocation();

  // ??초기??중에??리다?�렉??금�?
  if (initializing) return <div>로딩 중�?/div>;
  if (loading) return null; // 로딩 �??�피??
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
