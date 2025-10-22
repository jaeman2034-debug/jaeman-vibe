import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface Props {
  clubId: string;
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}

export default function SubscribeButton({ clubId, onSuccess, onError }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const fn = httpsCallable(getFunctions(), 'createStripeSubscriptionCheckout');
      const res: any = await fn({ clubId });
      const url = res?.data?.url;
      
      if (!url) throw new Error('checkout URL 없음');
      
      onSuccess?.(url);
      window.location.href = url; // Stripe Checkout으로 이동
    } catch (e: any) {
      const errorMsg = e?.message || '구독 시작 실패';
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
          <h3 className="font-semibold">월 구독 가입</h3>
          <p className="text-sm text-gray-600">Stripe를 통한 안전한 월 구독 결제</p>
        </div>
        <button
          onClick={onClick}
          disabled={loading}
          className="px-4 py-2 rounded-lg border shadow-sm bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? '이동 중…' : '구독하기'}
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
