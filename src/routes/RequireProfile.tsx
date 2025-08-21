import { Navigate } from 'react-router-dom';
import { getUid } from '../lib/auth';

export default function RequireProfile({ children }: { children: JSX.Element }) {
  const uid = getUid();
  if (!uid) return <Navigate to="/login" replace />;
  // TODO: phoneNumber 체크는 별도 함수로 구현 필요
  // if (!user.phoneNumber) return <Navigate to="/signup/phone-voice" replace />;
  return children;
} 