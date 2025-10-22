import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function AcceptInvite() {
  const token = new URLSearchParams(location.search).get('token') || '';
  const { user, ready, loginGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function accept() {
    if (!user || !token) return;
    
    setLoading(true);
    setError('');
    
    try {
      const idToken = await user.getIdToken();
      const resp = await fetch('/api/invites/accept', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${idToken}` 
        }, 
        body: JSON.stringify({ token }) 
      });
      
      const data = await resp.json();
      if (data.ok) {
        alert('클럽에 합류했습니다!');
        window.location.href = '/clubs';
      } else {
        setError(data.error || '초대 수락에 실패했습니다.');
      }
    } catch (e) {
      setError('오류가 발생했습니다: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return <div className="p-6">로딩 중…</div>;
  
  if (!user) {
    return (
      <div className="mx-auto max-w-md p-6 space-y-4 text-center">
        <h1 className="text-2xl font-bold">클럽 초대</h1>
        <p className="text-sm text-zinc-500">로그인이 필요합니다.</p>
        <button 
          className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors"
          onClick={loginGoogle}
        >
          Google로 로그인
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-6 space-y-4 text-center">
      <h1 className="text-2xl font-bold">클럽 초대</h1>
      <p className="text-sm text-zinc-500">토큰: {token.slice(0, 8)}…</p>
      
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <button 
        className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
        onClick={accept}
        disabled={loading || !token}
      >
        {loading ? '처리 중…' : '초대 수락'}
      </button>
    </div>
  );
}
