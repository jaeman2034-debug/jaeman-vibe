import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';

export default function PayFail(){
  const [sp] = useSearchParams();
  return (
    <div className="max-w-md mx-auto p-6 space-y-4 text-center">
      <h1 className="text-2xl font-semibold">결제 실패</h1>
      <div className="rounded-xl border p-4 bg-red-50 text-red-700">
        {sp.get('message') || '결제가 취소되었거나 실패했습니다.'}
      </div>
      <div className="text-sm">사유코드: {sp.get('code') || '-'}</div>
      <Link to="/" className="underline text-sm">홈으로</Link>
    </div>
  );
}