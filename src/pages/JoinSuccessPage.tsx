import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function JoinSuccessPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('결제 확인 중…');
  const [gateway, setGateway] = useState<string>('');

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        const paymentKey = searchParams.get('paymentKey');
        const orderId = searchParams.get('orderId');
        const amount = Number(searchParams.get('amount') || 0);
        const sessionId = searchParams.get('session_id');

        // Toss 결제인 경우
        if (paymentKey && orderId && amount) {
          setGateway('Toss');
          const confirm = httpsCallable(getFunctions(), 'confirmTossPayment');
          const res: any = await confirm({ paymentKey, orderId, amount });
          setStatus('success');
          setMessage('가입이 완료되었습니다!');
        }
        // Stripe 결제인 경우
        else if (sessionId) {
          setGateway('Stripe');
          const confirm = httpsCallable(getFunctions(), 'confirmStripePayment');
          const res: any = await confirm({ sessionId });
          setStatus('success');
          setMessage('가입이 완료되었습니다!');
        }
        // 파라미터가 없는 경우
        else {
          setStatus('error');
          setMessage('결제 정보를 찾을 수 없습니다.');
        }
      } catch (e: any) {
        setStatus('error');
        setMessage(e?.message || '결제 승인에 실패했습니다. 문의해주세요.');
        console.error('Payment confirmation error:', e);
      }
    };

    confirmPayment();
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
            {status === 'success' ? '가입 완료!' : 
             status === 'error' ? '오류 발생' : '처리 중...'}
          </h1>
          
          <p className="text-gray-600 mb-6">{message}</p>
          
          {gateway && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                결제 게이트웨이: <span className="font-medium">{gateway}</span>
              </p>
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
                onClick={() => window.location.reload()}
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
