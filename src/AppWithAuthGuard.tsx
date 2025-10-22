import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import BottomNavigation from '@/components/BottomNavigation';

export default function AppWithAuthGuard() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(() => {});
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setReady(true); });
    return () => unsub();
  }, []);

  if (!ready) return <div style={{ padding: 24 }}>로딩 중…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return (
    <>
      <Outlet />
      <BottomNavigation />
    </>
  );
}