import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function BillingSuccessPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('빌링키 등록 확인 중…');
  const [billingInfo, setBillingInfo] = useState<any>(null);

  useEffect(() => {
    const authKey = searchParams.get('authKey');
    const customerKey = searchParams.get('customerKey');
    const clubId = searchParams.get('clubId');
    
    if (!authKey || !customerKey || !clubId) {
      setStatus('error');
      setMessage('필수 파라미터가 누락되었습니다.');
      return;
    }

    const registerBillingKey = async () => {
      try {
        const fn = httpsCallable(getFunctions(), 'issueTossBillingKey');
        const res: any = await fn({ authKey, customerKey, clubId });
        
        setStatus('success');
        setMessage('빌링키가 성공적으로 등록되었습니다!');
        setBillingInfo(res.data);
      } catch (e: any) {
        setStatus('error');
        setMessage(e?.message || '빌링키 등록에 실패했습니다.');
        console.error('Billing key registration error:', e);
      }
    };

    registerBillingKey();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          {status === 'loading' && (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          )}
          
          {status === 'success' && (
            <div className="text-green-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
          
          <h1 className="text-xl font-semibold mb-2">
            {status === 'success' ? '빌링키 등록 완료!' : 
             status === 'error' ? '등록 실패' : '처리 중...'}
          </h1>
          
          <p className="text-gray-600 mb-6">{message}</p>
          
          {billingInfo && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">등록된 정보</h3>
              <div className="text-sm text-green-700 space-y-1">
                <p>빌링키: {billingInfo.billingKey?.substring(0, 8)}...</p>
                <p>고객키: {billingInfo.customerKey}</p>
                <p>주문명: {billingInfo.orderName}</p>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              홈으로 돌아가기
            </button>
            
            {status === 'error' && (
              <button
                onClick={() => window.history.back()}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                다시 시도
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
