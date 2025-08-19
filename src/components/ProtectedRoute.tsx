import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthProvider';

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return children;
} 