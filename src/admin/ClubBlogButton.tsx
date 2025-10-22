import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

interface Props { 
  clubId: string;
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}

export default function ClubBlogButton({ clubId, onSuccess, onError }: Props) {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setLoading(true); 
    setError(null);
    try {
      const auth = getAuth();
      if (!auth.currentUser) throw new Error('로그인이 필요합니다');
      
      const fn = httpsCallable(getFunctions(), 'createClubBlog');
      const res: any = await fn({ clubId });
      
      const notionUrl = res?.data?.notionUrl;
      if (notionUrl) {
        setUrl(notionUrl);
        onSuccess?.(notionUrl);
      }
    } catch (e: any) {
      const errorMsg = e?.message || '생성에 실패했습니다';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 rounded-xl border bg-white">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Notion 블로그</h3>
        <button
          onClick={onClick}
          disabled={loading}
          className="px-4 py-2 rounded-lg border shadow-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '생성 중…' : 'Notion 블로그 생성'}
        </button>
      </div>
      
      {url && (
        <div className="mt-2 p-2 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            ✅ 생성됨: <a href={url} target="_blank" rel="noreferrer" className="underline">Notion에서 열기</a>
          </p>
        </div>
      )}
      
      {error && (
        <div className="mt-2 p-2 bg-red-50 rounded-lg">
          <p className="text-sm text-red-600">⚠ {error}</p>
        </div>
      )}
    </div>
  );
}
