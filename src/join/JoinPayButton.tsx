import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface Props {
  clubId: string;
  amount: number;
  orderName?: string;
  onSuccess?: (orderId: string) => void;
  onError?: (error: string) => void;
}

export default function JoinPayButton({ clubId, amount, orderName, onSuccess, onError }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPay = async () => {
    setLoading(true);
    setError(null);
    try {
      const fn = httpsCallable(getFunctions(), 'createTossCheckout');
      const res: any = await fn({ clubId, amount, orderName });
      const url = res?.data?.checkoutUrl;
      
      if (!url) throw new Error('checkoutUrl 없음');
      
      // Hosted 결제창으로 이동
      window.location.href = url;
    } catch (e: any) {
      const errorMsg = e?.message || '결제 시작 실패';
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
          <h3 className="font-semibold">회원가입 결제</h3>
          <p className="text-sm text-gray-600">{orderName || '클럽 회원가입'} - {amount.toLocaleString()}원</p>
        </div>
        <button
          onClick={onPay}
          disabled={loading}
          className="px-4 py-2 rounded-lg border shadow-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? '이동 중…' : '결제하고 가입하기'}
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
