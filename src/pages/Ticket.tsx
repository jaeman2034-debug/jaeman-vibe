import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '@/lib/firebase';

export default function TicketPage() {
  const { eventId, regId } = useParams(); // /events/:eventId/ticket/:regId
  const [img, setImg] = useState<string>('');
  const [exp, setExp] = useState<number>(0);
  const [err, setErr] = useState<string>('');
  const [left, setLeft] = useState<number>(0);

  useEffect(() => {
    (async () => {
      try {
        if (!auth.currentUser) throw new Error('로그인이 필요합니다.');
        const fn = httpsCallable(getFunctions(), 'issueTicket');
        const r: any = await fn({ eventId, registrationId: regId, ttlSec: 60 * 60 * 24 * 3 });
        const token = r?.data?.token;
        setExp(r?.data?.exp || 0);
        const dataUrl = await QRCode.toDataURL(token, { margin: 2, width: 320 });
        setImg(dataUrl);
      } catch (e: any) {
        setErr(e.message || String(e));
      }
    })();
  }, [eventId, regId]);

  // 남은 시간 카운트다운
  useEffect(() => {
    const t = setInterval(() => {
      if (exp) setLeft(Math.max(0, Math.floor(exp*1000 - Date.now())));
    }, 1000);
    return () => clearInterval(t);
  }, [exp]);

  async function reissue() {
    // 같은 Callable 다시
    const fn = httpsCallable(getFunctions(), 'issueTicket');
    const r: any = await fn({ eventId, registrationId: regId, ttlSec: 60*60*24*3 });
    const token = r?.data?.token;
    setExp(r?.data?.exp || 0);
    setImg(await QRCode.toDataURL(token, { margin: 2, width: 320 }));
  }

  if (err) return <div className="p-6 text-red-600">에러: {err}</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">입장 티켓</h1>
      <p className="text-sm text-gray-600">현장에서 스태프에게 이 QR을 보여주세요.</p>
      {img ? <img src={img} alt="ticket-qr" className="rounded-xl shadow" /> : <p>토큰 생성 중...</p>}
      
      {/* 남은 시간/재발급 버튼 */}
      <p className="text-xs text-gray-500">
        유효기간: {left ? `${Math.ceil(left/1000)}초 남음` : '만료됨'}
      </p>
      <button onClick={reissue} className="px-3 py-1 rounded border">재발급</button>
    </div>
  );
}
