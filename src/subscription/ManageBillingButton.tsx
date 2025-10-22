import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface Props {
  clubId: string;
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}

export default function ManageBillingButton({ clubId, onSuccess, onError }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const fn = httpsCallable(getFunctions(), 'createStripePortalSession');
      const res: any = await fn({ clubId });
      const url = res?.data?.url;
      
      if (!url) throw new Error('portal URL 없음');
      
      onSuccess?.(url);
      window.location.href = url; // Stripe Customer Portal로 이동
    } catch (e: any) {
      const errorMsg = e?.message || '포털 열기 실패';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 rounded-xl border bg-white">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold">구독 관리</h3>
          <p className="text-sm text-gray-600">결제 수단 변경, 구독 해지 등</p>
        </div>
        <button
          onClick={onClick}
          disabled={loading}
          className="px-4 py-2 rounded-lg border shadow-sm bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? '이동 중…' : '관리하기'}
        </button>
      </div>
      
      {error && (
        <div className="mt-2 p-2 bg-red-50 rounded-lg">
          <p className="text-sm text-red-600">⚠ {error}</p>
        </div>
      )}
    </div>
  );
}
