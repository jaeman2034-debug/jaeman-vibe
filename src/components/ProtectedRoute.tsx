import { Navigate } from 'react-router-dom';
import { auth } from '@/lib/firebase';

const ADMIN_UIDS = new Set<string>(['YOUR_ADMIN_UID']);

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const uid = auth.currentUser?.uid;
  if (!uid || !ADMIN_UIDS.has(uid)) return <Navigate to="/" replace />;
  return children;
}