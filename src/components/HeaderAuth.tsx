import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';

export default function HeaderAuth() {
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, user => setUid(user?.uid ?? null));
  }, []);

  if (!uid) {
    return (
      <button 
        onClick={() => signInAnonymously(auth)} 
        className="px-3 py-1 rounded bg-black text-white hover:bg-gray-800 transition"
      >
        개발용 로그인
      </button>
    );
  }
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">UID: {uid.slice(0, 6)}…</span>
      <button 
        onClick={() => signOut(auth)} 
        className="px-3 py-1 rounded border hover:bg-gray-50 transition"
      >
        로그아웃
      </button>
    </div>
  );
}
