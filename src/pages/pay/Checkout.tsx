import { useParams, Link } from "react-router-dom";
import { useEventIdGuard } from "@/hooks/useEventIdGuard";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { join, leave } from "@/api/events";

export default function Checkout(){
  const eventId = useEventIdGuard();
  
  // 잘못된 링크면 자동으로 목록으로 리다이렉트
  if (typeof eventId === 'object') {
    return eventId;
  }
  const [evt,setEvt] = useState<any>(null);
  const [err,setErr] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [joining, setJoining] = useState(false);
  const [success, setSuccess] = useState(false);
  const [attendeeStatus, setAttendeeStatus] = useState<'none' | 'joined' | 'waitlisted'>('none');

  useEffect(()=>{ (async ()=>{
    if (!eventId) { setErr('missing'); return; }
    try {
      const s = await getDoc(doc(db,'events',eventId));
      if (!s.exists()) setErr('notfound'); else setEvt({id:s.id,...s.data()});
    } catch (e:any) { setErr(e.code || 'load-failed'); }
  })(); },[eventId]);

  // 참가 상태 확인
  useEffect(() => {
    if (!user || !eventId) return;
    
    const checkStatus = async () => {
      try {
        const [attendeeDoc, waitlistDoc] = await Promise.all([
          getDoc(doc(db, 'events', eventId, 'attendees', user.uid)),
          getDoc(doc(db, 'events', eventId, 'waitlist', user.uid))
        ]);
        
        if (attendeeDoc.exists() && attendeeDoc.data()?.status === 'joined') {
          setAttendeeStatus('joined');
        } else if (waitlistDoc.exists() && waitlistDoc.data()?.status === 'waiting') {
          setAttendeeStatus('waitlisted');
        } else {
          setAttendeeStatus('none');
        }
      } catch (error) {
        console.error('참가 상태 확인 실패:', error);
      }
    };
    
    checkStatus();
  }, [user, eventId]);

  // Auth 상태 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  if (err) return (
    <div className="p-4 border rounded text-red-600">
      해당 이벤트가 존재하지 않습니다. <Link className="underline" to="/events">모임 목록으로 돌아가기</Link>
    </div>
  );
  if (!evt) return <button disabled className="px-3 py-1 border rounded">이벤트 정보 로딩 중…</button>;

  const handleJoin = async () => {
    if (!user || !eventId) return;
    
    setJoining(true);
    try {
      const r = await join(eventId);
      
      if (r.joined) {
        setAttendeeStatus('joined');
        setSuccess(true);
        console.log('✅ 참가 성공:', { eventId, userId: user.uid });
        
        // 3초 후 상세 페이지로 이동
        setTimeout(() => {
          window.location.href = `/events/${eventId}`;
        }, 2000);
      } else if (r.waitlisted) {
        setAttendeeStatus('waitlisted');
        alert('정원 초과 → 대기 신청 완료');
      } else if (r.already) {
        alert('이미 참가 중입니다');
      }

    } catch (error: any) {
      console.error('❌ 참가 실패:', error);
      const message = `${error.code ?? 'error'}: ${error.message ?? '참가 실패'}`;
      alert(message);
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!user || !eventId) return;
    
    setJoining(true);
    try {
      const r = await leave(eventId);
      
      if (r.left) {
        setAttendeeStatus('none');
        alert('참가 취소 완료');
      } else {
        alert('이미 취소 상태');
      }
      
    } catch (error: any) {
      console.error('❌ 취소 실패:', error);
      const message = `${error.code ?? 'error'}: ${error.message ?? '취소 실패'}`;
      alert(message);
    } finally {
      setJoining(false);
    }
  };

  if (success) {
  return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-green-600 text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">참가 완료!</h2>
          <p className="text-green-600 mb-4">이벤트에 성공적으로 참가했습니다.</p>
          <p className="text-sm text-gray-500">잠시 후 상세 페이지로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">이벤트 참가</h1>
      
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">{evt.title}</h2>
        <p className="text-gray-600">스포츠: {evt.sport}</p>
        <p className="text-gray-600">장소: {evt.placeName || '미정'}</p>
        <p className="text-gray-600">정원: {evt.capacity}명</p>
        <p className="text-gray-600">참가비: {evt.fee ? `${evt.fee.toLocaleString()}원` : '무료'}</p>
        
        {evt.description && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">설명</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{evt.description}</p>
          </div>
        )}

        {!user && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">로그인이 필요합니다.</p>
            <Link to="/login" className="text-blue-600 underline">로그인하기</Link>
          </div>
        )}

        <div className="flex gap-2 mt-6">
          <Link to="/events" className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            목록으로
          </Link>
          {user && (
            <>
              {evt.status !== 'open' ? (
                <button disabled className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed">
                  {evt.status === 'closed' ? '마감됨' : '진행 불가'}
                </button>
              ) : attendeeStatus === 'joined' ? (
                <button 
                  onClick={handleLeave}
                  disabled={joining}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {joining ? '취소 중...' : '참가 취소'}
                </button>
              ) : attendeeStatus === 'waitlisted' ? (
                <button 
                  onClick={handleLeave}
                  disabled={joining}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                >
                  {joining ? '취소 중...' : '대기 취소'}
                </button>
              ) : (
                <button 
                  onClick={handleJoin}
                  disabled={joining}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  {joining ? '처리 중...' : (evt.fee ? '결제하기' : '무료 참가하기')}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}