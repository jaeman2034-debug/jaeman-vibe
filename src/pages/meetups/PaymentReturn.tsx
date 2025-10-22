import React from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';

export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const rid = searchParams.get('reservationId') || '';
  
  return (
    <AppLayout>
      <div className="mx-auto max-w-md p-6 text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          ✅
        </div>
        <div>
          <h1 className="text-2xl font-bold text-green-600">결제가 완료됐어요</h1>
          <p className="text-sm text-zinc-500 mt-2">예약ID: {rid}</p>
        </div>
        
        <div className="space-y-3">
          <a 
            className="block w-full px-4 py-3 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors"
            href={`/ticket/${rid}.png`} 
            target="_blank"
          >
            QR 티켓 보기
          </a>
          <a 
            className="block w-full px-4 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 transition-colors"
            href={`/ics/${rid}.ics`}
            download
          >
            캘린더 추가(.ics)
          </a>
          <a 
            className="block w-full px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            href="/meetups"
          >
            모임 둘러보기
          </a>
        </div>
        
        <div className="text-xs text-zinc-400">
          QR 코드를 현장에서 보여주시면 체크인됩니다.
        </div>
      </div>
    </AppLayout>
  );
}

export function PaymentFail() {
  const [searchParams] = useSearchParams();
  const rid = searchParams.get('reservationId') || '';
  
  return (
    <AppLayout>
      <div className="mx-auto max-w-md p-6 text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          ❌
        </div>
        <div>
          <h1 className="text-2xl font-bold text-red-600">결제가 취소/실패했어요</h1>
          <p className="text-sm text-zinc-500 mt-2">예약ID: {rid}</p>
        </div>
        
        <div className="space-y-3">
          <a 
            className="block w-full px-4 py-3 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors"
            href={`/meetups`}
          >
            모임 목록으로 돌아가기
          </a>
          {rid && (
            <a 
              className="block w-full px-4 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 transition-colors"
              href={`/meetups/${rid.replace('r_', '')}`}
            >
              해당 모임 다시 보기
            </a>
          )}
        </div>
        
        <div className="text-xs text-zinc-400">
          문제가 지속되면 고객센터로 문의해주세요.
        </div>
      </div>
    </AppLayout>
  );
}
