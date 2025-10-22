import React, { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface Props {
  clubId: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    TossPayments: any;
  }
}

export default function TossBillingRegister({ clubId, onSuccess, onError }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingStatus, setBillingStatus] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    checkBillingStatus();
  }, []);

  const checkBillingStatus = async () => {
    try {
      const fn = httpsCallable(getFunctions(), 'getTossBillingStatus');
      const res: any = await fn({});
      
      if (res.data.hasBillingKey) {
        setBillingStatus(res.data);
        setIsRegistered(true);
      }
    } catch (e) {
      console.error('Billing status check error:', e);
    }
  };

  const openBillingWindow = () => {
    if (!window.TossPayments) {
      setError('Toss Payments SDK가 로드되지 않았습니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tossPayments = window.TossPayments('test_ck_demo');
      
      tossPayments.requestBillingAuth({
        customerKey: `customer-${Date.now()}`,
        successUrl: `${window.location.origin}/billing/success?clubId=${clubId}`,
        failUrl: `${window.location.origin}/billing/fail?clubId=${clubId}`,
      });
    } catch (e: any) {
      setError(e?.message || '빌링키 등록창을 열 수 없습니다.');
      setLoading(false);
    }
  };

  const handleSuccess = (result: any) => {
    setIsRegistered(true);
    setBillingStatus(result);
    onSuccess?.(result);
  };

  const handleError = (error: string) => {
    setError(error);
    onError?.(error);
  };

  if (isRegistered && billingStatus) {
    return (
      <div className="p-4 rounded-xl border bg-green-50">
        <div className="flex items-center mb-2">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          <h3 className="font-semibold text-green-800">빌링키 등록됨</h3>
        </div>
        <div className="text-sm text-green-700">
          <p>빌링키: {billingStatus.billingKey?.substring(0, 8)}...</p>
          <p>상태: {billingStatus.status}</p>
          <p>등록일: {billingStatus.createdAt ? new Date(billingStatus.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border bg-white">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg">Toss 정기결제 등록</h3>
          <p className="text-sm text-gray-600">
            빌링키를 등록하여 자동 결제를 설정하세요
          </p>
        </div>
        
        <button
          onClick={openBillingWindow}
          disabled={loading}
          className="px-4 py-2 rounded-lg border shadow-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '등록 중…' : '빌링키 등록'}
        </button>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 rounded-lg">
          <p className="text-sm text-red-600">⚠ {error}</p>
        </div>
      )}

      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">💡 빌링키란?</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• 카드 정보를 안전하게 저장하여 자동 결제가 가능합니다</p>
          <p>• 매월 자동으로 회비가 결제됩니다</p>
          <p>• 언제든지 해지할 수 있습니다</p>
        </div>
      </div>
    </div>
  );
}
