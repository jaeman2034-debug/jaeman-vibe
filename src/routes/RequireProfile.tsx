import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthProvider';

export default function RequireProfile({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.phoneNumber) return <Navigate to="/signup/phone-voice" replace />;
  return children;
} 