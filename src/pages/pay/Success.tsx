import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function PaySuccess(){
  const [sp] = useSearchParams();
  const [msg,setMsg] = useState('확인 중…');
  const [ok,setOk] = useState(false);

  const paymentKey = sp.get('paymentKey') || '';
  const orderId    = sp.get('orderId') || '';
  const amount     = Number(sp.get('amount') || '0');

  useEffect(()=>{
    (async()=>{
      try{
        const fn = httpsCallable(getFunctions(),'tossConfirmPayment');
        await fn({ paymentKey, orderId, amount });
        setOk(true); setMsg('결제가 완료되었습니다.');
      }catch(e:any){
        setOk(false); setMsg(e?.message || '결제 확인 실패');
      }
    })();
  },[paymentKey, orderId, amount]);

  return (
    <div className="max-w-md mx-auto p-6 space-y-4 text-center">
      <h1 className="text-2xl font-semibold">결제 결과</h1>
      <div className={`rounded-xl border p-4 ${ok?'bg-emerald-50 text-emerald-700':'bg-yellow-50 text-yellow-800'}`}>
        {msg}
      </div>
      <div className="text-sm">주문번호: {orderId} · 금액: {amount.toLocaleString()}원</div>
      <Link to="/" className="underline text-sm">홈으로</Link>
    </div>
  );
}