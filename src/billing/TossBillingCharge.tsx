import React, { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface Props {
  clubId: string;
  amount: number;
  orderName?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

export default function TossBillingCharge({ 
  clubId, 
  amount, 
  orderName, 
  onSuccess, 
  onError 
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingStatus, setBillingStatus] = useState<any>(null);
  const [hasBillingKey, setHasBillingKey] = useState(false);

  useEffect(() => {
    checkBillingStatus();
  }, []);

  const checkBillingStatus = async () => {
    try {
      const fn = httpsCallable(getFunctions(), 'getTossBillingStatus');
      const res: any = await fn({});
      
      if (res.data.hasBillingKey) {
        setBillingStatus(res.data);
        setHasBillingKey(true);
      }
    } catch (e) {
      console.error('Billing status check error:', e);
    }
  };

  const chargeBilling = async () => {
    setLoading(true);
    setError(null);

    try {
      const fn = httpsCallable(getFunctions(), 'chargeTossBilling');
      const res: any = await fn({ 
        clubId, 
        amount, 
        orderName: orderName || `${clubId} 정기결제 (${new Date().toISOString().slice(0, 7)})`
      });

      onSuccess?.(res.data);
    } catch (e: any) {
      const errorMsg = e?.message || '정기결제 실행에 실패했습니다';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!hasBillingKey) {
    return (
      <div className="p-4 rounded-xl border bg-yellow-50">
        <div className="flex items-center mb-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
          <h3 className="font-semibold text-yellow-800">빌링키 미등록</h3>
        </div>
        <p className="text-sm text-yellow-700 mb-3">
          정기결제를 사용하려면 먼저 빌링키를 등록해야 합니다.
        </p>
        <button
          onClick={() => window.location.href = `/billing/register/${clubId}`}
          className="px-4 py-2 rounded-lg border shadow-sm bg-yellow-600 text-white hover:bg-yellow-700"
        >
          빌링키 등록하기
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border bg-white">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg">정기결제 실행</h3>
          <p className="text-sm text-gray-600">
            등록된 빌링키로 자동 결제를 실행합니다
          </p>
          <p className="text-xs text-gray-500 mt-1">
            금액: {amount.toLocaleString()}원
          </p>
        </div>
        
        <button
          onClick={chargeBilling}
          disabled={loading || billingStatus?.status !== 'active'}
          className="px-4 py-2 rounded-lg border shadow-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? '결제 중…' : '정기결제 실행'}
        </button>
      </div>

      {billingStatus && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <p>빌링키: {billingStatus.billingKey?.substring(0, 8)}...</p>
            <p>상태: <span className={`font-medium ${
              billingStatus.status === 'active' ? 'text-green-600' : 'text-red-600'
            }`}>{billingStatus.status}</span></p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-50 rounded-lg">
          <p className="text-sm text-red-600">⚠ {error}</p>
        </div>
      )}

      <div className="mt-3 p-3 bg-green-50 rounded-lg">
        <h4 className="font-medium text-green-800 mb-2">✅ 정기결제 장점</h4>
        <div className="text-sm text-green-700 space-y-1">
          <p>• 매월 자동으로 회비가 결제됩니다</p>
          <p>• 결제 실패 시 자동 재시도됩니다</p>
          <p>• 언제든지 해지할 수 있습니다</p>
        </div>
      </div>
    </div>
  );
}
