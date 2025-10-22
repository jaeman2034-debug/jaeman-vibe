import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TossBillingRegister from '../billing/TossBillingRegister';

export default function BillingRegisterPage() {
  const { clubId } = useParams();
  const [tossLoaded, setTossLoaded] = useState(false);

  useEffect(() => {
    // Toss Payments SDK 로드
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v1/payment-widget';
    script.onload = () => setTossLoaded(true);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  if (!clubId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-600 mb-2">오류</h1>
          <p className="text-gray-600">클럽 ID가 필요합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">빌링키 등록</h1>
          <p className="text-gray-600">
            정기결제를 위한 빌링키를 등록하세요
          </p>
        </div>

        {!tossLoaded && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Toss Payments SDK 로딩 중...</p>
          </div>
        )}

        {tossLoaded && (
          <TossBillingRegister
            clubId={clubId}
            onSuccess={(result) => {
              console.log('Billing key registered:', result);
              // 성공 시 홈으로 리다이렉트 또는 성공 페이지로 이동
              setTimeout(() => {
                window.location.href = '/';
              }, 2000);
            }}
            onError={(error) => {
              console.error('Billing key registration error:', error);
            }}
          />
        )}

        <div className="mt-8 p-6 bg-white rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">빌링키 등록 안내</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">1.</span>
              <p>빌링키 등록 버튼을 클릭하면 Toss Payments 등록창이 열립니다.</p>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">2.</span>
              <p>카드 정보를 입력하고 인증을 완료합니다.</p>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">3.</span>
              <p>등록 완료 후 자동으로 정기결제가 가능합니다.</p>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">4.</span>
              <p>언제든지 해지하거나 결제 수단을 변경할 수 있습니다.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-medium text-yellow-800 mb-2">⚠️ 주의사항</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>• 빌링키는 안전하게 암호화되어 저장됩니다</p>
            <p>• 카드 정보는 Toss Payments에서 직접 관리됩니다</p>
            <p>• 정기결제는 매월 자동으로 실행됩니다</p>
          </div>
        </div>
      </div>
    </div>
  );
}
