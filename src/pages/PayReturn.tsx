import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyPaymentOnServer } from '@/lib/payments';

export default function PayReturn() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const [msg, setMsg] = useState('결제 검증 중...');

  useEffect(() => {
    (async () => {
      try {
        // URL 예시: /pay/return?provider=toss&eventId=E123&regId=R456&paymentKey=...&orderId=...&amount=10000
        const provider = (sp.get('provider') || 'toss') as 'toss'|'portone'|'mock';
        const eventId = sp.get('eventId')!;
        const registrationId = sp.get('regId')!;
        const payload: any = {
          paymentKey: sp.get('paymentKey') || undefined,
          orderId: sp.get('orderId') || sp.get('merchant_uid') || undefined,
          amount: Number(sp.get('amount') || '0'),
          impUid: sp.get('imp_uid') || undefined,
          merchantUid: sp.get('merchant_uid') || undefined
        };

        const r = await verifyPaymentOnServer({ eventId, registrationId, provider, payload });
        setMsg('결제 검증 완료! 참가 확정 처리되었습니다.');
        // 확정된 이벤트 상세로 이동
        setTimeout(() => nav(`/events/${eventId}?tab=me`), 800);
      } catch (e: any) {
        console.error(e);
        setMsg(`결제 검증 실패: ${e?.message || e}`);
      }
    })();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">결제 결과</h1>
      <p className="mt-2">{msg}</p>
    </div>
  );
}
