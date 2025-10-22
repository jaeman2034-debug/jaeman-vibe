import React, { useState } from 'react';
import JoinPaySmartButton from './JoinPaySmartButton';
import CurrencySelector from './CurrencySelector';

interface Props {
  clubId: string;
  defaultAmount?: number;
  defaultOrderName?: string;
}

export default function SmartPaymentPage({ 
  clubId, 
  defaultAmount = 30000, 
  defaultOrderName 
}: Props) {
  const [currency, setCurrency] = useState('KRW');
  const [gateway, setGateway] = useState<'auto' | 'toss' | 'stripe'>('auto');
  const [amount, setAmount] = useState(defaultAmount);
  const [orderName, setOrderName] = useState(defaultOrderName || '');
  const [lastResult, setLastResult] = useState<any>(null);

  const handleSuccess = (result: any) => {
    setLastResult(result);
    console.log('결제 시작 성공:', result);
  };

  const handleError = (error: string) => {
    console.error('결제 시작 실패:', error);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">스마트 결제</h1>
        <p className="text-gray-600">
          통화와 게이트웨이를 선택하여 최적의 결제 방법을 사용하세요
        </p>
      </div>

      {/* 통화 및 게이트웨이 선택 */}
      <CurrencySelector
        onCurrencyChange={setCurrency}
        onGatewayChange={setGateway}
        selectedCurrency={currency}
        selectedGateway={gateway}
      />

      {/* 금액 및 주문명 설정 */}
      <div className="p-4 rounded-xl border bg-white">
        <h3 className="font-semibold mb-3">결제 정보</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              결제 금액
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="결제 금액을 입력하세요"
              />
              <span className="text-sm text-gray-500 min-w-fit">
                {currency === 'KRW' ? '원' : currency}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              주문명
            </label>
            <input
              type="text"
              value={orderName}
              onChange={(e) => setOrderName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="주문명을 입력하세요"
            />
          </div>
        </div>
      </div>

      {/* 스마트 결제 버튼 */}
      <JoinPaySmartButton
        clubId={clubId}
        amount={amount}
        orderName={orderName}
        currency={currency}
        gateway={gateway}
        onSuccess={handleSuccess}
        onError={handleError}
      />

      {/* 마지막 결과 표시 */}
      {lastResult && (
        <div className="p-4 rounded-xl border bg-green-50">
          <h3 className="font-semibold text-green-800 mb-2">결제 시작됨</h3>
          <div className="text-sm text-green-700">
            <p>게이트웨이: {lastResult.gateway?.toUpperCase()}</p>
            <p>주문 ID: {lastResult.orderId}</p>
            <p>통화: {lastResult.currency}</p>
            <p>금액: {lastResult.amount?.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* 도움말 */}
      <div className="p-4 rounded-xl border bg-blue-50">
        <h3 className="font-semibold text-blue-800 mb-2">💡 도움말</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• <strong>자동 선택:</strong> KRW는 Toss, 다른 통화는 Stripe 사용</p>
          <p>• <strong>Toss:</strong> 한국 카드/계좌이체, 간편결제 지원</p>
          <p>• <strong>Stripe:</strong> 글로벌 카드, Apple Pay, Google Pay 지원</p>
          <p>• 결제 완료 후 자동으로 클럽 멤버십이 활성화됩니다</p>
        </div>
      </div>
    </div>
  );
}
