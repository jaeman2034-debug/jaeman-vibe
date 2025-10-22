import React, { useState } from 'react';

interface Props {
  onCurrencyChange: (currency: string) => void;
  onGatewayChange: (gateway: 'auto' | 'toss' | 'stripe') => void;
  selectedCurrency: string;
  selectedGateway: 'auto' | 'toss' | 'stripe';
}

export default function CurrencySelector({ 
  onCurrencyChange, 
  onGatewayChange, 
  selectedCurrency, 
  selectedGateway 
}: Props) {
  const currencies = [
    { code: 'KRW', name: '한국 원', symbol: '₩', gateway: 'toss' as const },
    { code: 'USD', name: '미국 달러', symbol: '$', gateway: 'stripe' as const },
    { code: 'EUR', name: '유로', symbol: '€', gateway: 'stripe' as const },
    { code: 'JPY', name: '일본 엔', symbol: '¥', gateway: 'stripe' as const },
  ];

  const handleCurrencyChange = (currency: string) => {
    onCurrencyChange(currency);
    
    // 통화에 따라 자동으로 게이트웨이 선택
    const currencyInfo = currencies.find(c => c.code === currency);
    if (currencyInfo) {
      onGatewayChange(currencyInfo.gateway);
    }
  };

  return (
    <div className="p-4 rounded-xl border bg-white">
      <h3 className="font-semibold mb-3">결제 설정</h3>
      
      <div className="space-y-4">
        {/* 통화 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            결제 통화
          </label>
          <div className="grid grid-cols-2 gap-2">
            {currencies.map((currency) => (
              <button
                key={currency.code}
                onClick={() => handleCurrencyChange(currency.code)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  selectedCurrency === currency.code
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">{currency.symbol} {currency.code}</div>
                <div className="text-xs text-gray-500">{currency.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 게이트웨이 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            결제 게이트웨이
          </label>
          <div className="space-y-2">
            <button
              onClick={() => onGatewayChange('auto')}
              className={`w-full p-3 rounded-lg border text-left transition-colors ${
                selectedGateway === 'auto'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">🤖 자동 선택</div>
              <div className="text-xs text-gray-500">
                KRW → Toss, 기타 → Stripe
              </div>
            </button>

            <button
              onClick={() => onGatewayChange('toss')}
              className={`w-full p-3 rounded-lg border text-left transition-colors ${
                selectedGateway === 'toss'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">💳 Toss Payments</div>
              <div className="text-xs text-gray-500">
                한국 결제 전용
              </div>
            </button>

            <button
              onClick={() => onGatewayChange('stripe')}
              className={`w-full p-3 rounded-lg border text-left transition-colors ${
                selectedGateway === 'stripe'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">🌍 Stripe</div>
              <div className="text-xs text-gray-500">
                글로벌 결제 지원
              </div>
            </button>
          </div>
        </div>

        {/* 현재 설정 요약 */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm">
            <span className="font-medium">현재 설정:</span>
            <span className="ml-2">
              {selectedCurrency} → {
                selectedGateway === 'auto' 
                  ? (selectedCurrency === 'KRW' ? 'Toss' : 'Stripe')
                  : selectedGateway.toUpperCase()
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
