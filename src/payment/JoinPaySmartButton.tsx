import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface Props {
  clubId: string;
  amount?: number;
  orderName?: string;
  currency?: string;
  gateway?: 'auto' | 'toss' | 'stripe';
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

export default function JoinPaySmartButton({ 
  clubId, 
  amount = 30000, 
  orderName, 
  currency = 'KRW', 
  gateway = 'auto',
  onSuccess,
  onError 
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<'toss' | 'stripe' | null>(null);

  const onClick = async () => {
    setLoading(true);
    setError(null);
    setSelectedGateway(null);

    try {
      const fn = httpsCallable(getFunctions(), 'createSmartCheckout');
      const res: any = await fn({ 
        clubId, 
        amount, 
        orderName, 
        currency, 
        gateway 
      });

      const { gateway: resultGateway, checkoutUrl, orderId } = res.data;
      setSelectedGateway(resultGateway);
      
      onSuccess?.(res.data);
      window.location.href = checkoutUrl; // 결제창으로 이동
    } catch (e: any) {
      const errorMsg = e?.message || '결제 시작 실패';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (loading) return '이동 중…';
    if (selectedGateway) return `${selectedGateway.toUpperCase()} 결제창으로 이동 중…`;
    
    if (gateway === 'auto') {
      return currency === 'KRW' ? 'Toss로 결제하기' : 'Stripe로 결제하기';
    }
    
    return `${gateway.toUpperCase()}로 결제하기`;
  };

  const getButtonColor = () => {
    if (selectedGateway === 'toss') return 'bg-blue-600 hover:bg-blue-700';
    if (selectedGateway === 'stripe') return 'bg-purple-600 hover:bg-purple-700';
    if (gateway === 'toss') return 'bg-blue-600 hover:bg-blue-700';
    if (gateway === 'stripe') return 'bg-purple-600 hover:bg-purple-700';
    
    return currency === 'KRW' 
      ? 'bg-blue-600 hover:bg-blue-700' 
      : 'bg-purple-600 hover:bg-purple-700';
  };

  return (
    <div className="p-4 rounded-xl border bg-white">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg">스마트 결제</h3>
          <p className="text-sm text-gray-600">
            {gateway === 'auto' 
              ? `${currency} 기준 자동 게이트웨이 선택` 
              : `${gateway.toUpperCase()} 게이트웨이 사용`}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            금액: {amount.toLocaleString()} {currency}
          </p>
        </div>
        
        <button
          onClick={onClick}
          disabled={loading}
          className={`px-6 py-3 rounded-lg text-white font-medium shadow-sm disabled:opacity-50 ${getButtonColor()}`}
        >
          {getButtonText()}
        </button>
      </div>

      {selectedGateway && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center text-sm">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              selectedGateway === 'toss' ? 'bg-blue-500' : 'bg-purple-500'
            }`}></div>
            <span className="font-medium">
              {selectedGateway === 'toss' ? 'Toss Payments' : 'Stripe'} 게이트웨이 선택됨
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-50 rounded-lg">
          <p className="text-sm text-red-600">⚠ {error}</p>
        </div>
      )}
    </div>
  );
}
