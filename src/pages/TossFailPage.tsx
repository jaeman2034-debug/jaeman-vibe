import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function TossFailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const code = searchParams.get('code');
  const message = searchParams.get('message');
  const orderId = searchParams.get('orderId');
  
  const getErrorMessage = (code: string | null) => {
    const errorMessages: Record<string, string> = {
      'PAY_PROCESS_CANCELED': '결제가 취소?�었?�니??',
      'PAY_PROCESS_ABORTED': '결제가 중단?�었?�니??',
      'INVALID_CARD': '?�효?��? ?��? 카드?�니??',
      'INSUFFICIENT_FUNDS': '?�액??부족합?�다.',
      'CARD_EXPIRED': '만료??카드?�니??',
      'INVALID_PASSWORD': '카드 비�?번호가 ?�바르�? ?�습?�다.',
      'PAYMENT_FAILED': '결제???�패?�습?�다.',
      'TIMEOUT': '결제 ?�간??초과?�었?�니??',
      'NETWORK_ERROR': '?�트?�크 ?�류가 발생?�습?�다.'
    };
    
    return errorMessages[code || ''] || message || '?????�는 ?�류가 발생?�습?�다.';
  };
  
  const handleRetry = () => {
    // ?�전 ?�이지�??�아가???�시??
    navigate(-1);
  };
  
  const handleGoHome = () => {
    navigate("/");
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="text-red-500 text-6xl mb-4">??/div>
        <div className="text-2xl font-bold text-gray-800 mb-4">결제 ?�패</div>
        
        <div className="bg-white border border-red-200 rounded-lg p-4 mb-6 text-left">
          <div className="text-sm font-medium text-gray-700 mb-2">?�류 ?�보</div>
          <div className="space-y-2 text-sm">
            {code && (
              <div className="flex justify-between">
                <span className="text-gray-600">?�류 코드:</span>
                <span className="font-mono text-red-600">{code}</span>
              </div>
            )}
            {orderId && (
              <div className="flex justify-between">
                <span className="text-gray-600">주문번호:</span>
                <span className="font-mono">{orderId}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">?�류 메시지:</span>
              <span className="text-red-600 max-w-xs text-right">{getErrorMessage(code)}</span>
            </div>
          </div>
        </div>
        
        <div className="text-gray-600 mb-6">
          결제???�패?�습?�다. ?�시 ?�도?�거???�른 결제 방법???�택?�주?�요.
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={handleRetry}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ?�시 ?�도
          </button>
          <button 
            onClick={handleGoHome}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ?�으�??�아가�?
          </button>
        </div>
        
        {/* ?��?�?*/}
        <div className="mt-6 text-xs text-gray-500">
          <div className="font-medium mb-2">?�� 결제 ?�패 ???�인?�항:</div>
          <ul className="text-left space-y-1">
            <li>??카드 ?�액??충분?��? ?�인</li>
            <li>??카드 ?�효기간 ?�인</li>
            <li>??카드 비�?번호 ?�확???�인</li>
            <li>???�트?�크 ?�결 ?�태 ?�인</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
