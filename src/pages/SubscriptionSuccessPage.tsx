import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function SubscriptionSuccessPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('구독 확인 중…');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (sessionId) {
      setStatus('success');
      setMessage('구독이 성공적으로 완료되었습니다!');
    } else {
      setStatus('error');
      setMessage('세션 정보를 찾을 수 없습니다.');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          {status === 'loading' && (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
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
            {status === 'success' ? '구독 완료!' : 
             status === 'error' ? '오류 발생' : '처리 중...'}
          </h1>
          
          <p className="text-gray-600 mb-6">{message}</p>
          
          <div className="space-y-2">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
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
