import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface RequireRoleProps {
  clubId: string;
  roles?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireRole({ 
  clubId, 
  roles = ['owner', 'manager'], 
  children, 
  fallback 
}: RequireRoleProps) {
  const { user, ready } = useAuth();
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!ready || !user) { 
        setOk(false); 
        setLoading(false);
        return; 
      }
      
      try {
        const idToken = await user.getIdToken();
        const resp = await fetch(`/api/clubs/${clubId}/my-role`, { 
          headers: { Authorization: `Bearer ${idToken}` } 
        });
        const data = await resp.json();
        setOk(roles.includes(data.role));
      } catch (e) {
        console.error('[RequireRole]', e);
        setOk(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [ready, user?.uid, clubId, roles]);

  if (loading) {
    return <div className="p-6 text-sm text-zinc-500">권한 확인 중…</div>;
  }

  if (!user) {
    return (
      <div className="p-6">
        <button 
          className="px-3 py-2 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors"
          onClick={() => window.location.href = '/auth'}
        >
          로그인 필요
        </button>
      </div>
    );
  }

  if (!ok) {
    return fallback || (
      <div className="p-6 text-sm text-red-500">
        권한이 없습니다. (필요: {roles.join(', ')})
      </div>
    );
  }

  return <>{children}</>;
}
