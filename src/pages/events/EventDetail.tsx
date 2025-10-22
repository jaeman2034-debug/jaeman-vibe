import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, onSnapshot, runTransaction, collection, addDoc, deleteDoc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { fmtKDT } from '@/lib/date';
import KakaoMapBadge from '@/components/KakaoMapBadge';
import { makeICS, buildRRule } from '@/lib/ical';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { loadToss } from '@/lib/toss';
import QuickActions from '@/components/community/QuickActions';
import PostList from '@/components/community/PostList';
import MediaGrid from '@/components/media/MediaGrid';
import EventEsportsTab from '@/components/esports/EventEsportsTab';
import ManageTab from '@/components/manage/ManageTab';
import LineupTab from '@/components/lineup/LineupTab';
import { useIsStaff } from '@/hooks/useIsStaff';
import { useDiscipline } from '@/hooks/useDiscipline';

interface EventDoc {
  title: string;
  sport: string;
  startAt: Timestamp;
  endAt?: Timestamp;
  capacity: number;
  fee: number;
  status: string;
  dongCode?: string;
  placeName?: string;
  lat?: number;
  lng?: number;
  images: string[];
  hostId: string;
  attendeeCount: number;
  description?: string;
  esports?: { enabled?: boolean; gameId?: string };
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('tab') || 'overview';
  const [ev, setEv] = useState<(EventDoc & { id: string }) | null>(null);
  const [joined, setJoined] = useState(false);
  const [wait, setWait] = useState<boolean>(false);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);

  const uid = auth.currentUser?.uid;
  const isStaff = useIsStaff(ev?.id);
  const { isBanned, banMessage, strikeCount } = useDiscipline();

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(doc(db, 'events', id), (snap) => {
      if (snap.exists()) {
        setEv({ id: snap.id, ...snap.data() } as EventDoc & { id: string });
      } else {
        setEv(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (!id || !uid) return;

    const unsubscribe = onSnapshot(doc(db, 'events', id, 'attendees', uid), (snap) => {
      setJoined(snap.exists());
    });

    return () => unsubscribe();
  }, [id, uid]);

  // 내 대기 상태 구독
  useEffect(()=>{
    if(!id || !uid) return;
    const wr = doc(db,'events',id,'waitlist', uid);
    const unsub = onSnapshot(wr, s => setWait(s.exists()));
    return () => unsub();
  },[id, uid]);

  // 내 mute 상태
  useEffect(()=>{
    if(!id || !uid) return;
    const mr = doc(db,'events',id,'mutes', uid);
    const unsub = onSnapshot(mr, s => setMuted(s.exists()));
    return () => unsub();
  },[id, uid]);

  const join = async () => {
    if (!id || !uid || !ev) return;
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'events', id);
        const att = doc(db, 'events', id, 'attendees', uid);
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error('존재하지 않는 모임');
        const data = snap.data() as EventDoc & { attendeeCount?: number };
        const count = data.attendeeCount ?? 0;
        const my = await tx.get(att);
        if (my.exists()) return; // 이미 참가
        if (count >= ev.capacity) throw new Error('정원이 마감되었습니다');
        tx.set(att, { joinedAt: new Date() });
        // attendeeCount 업데이트는 onAttendeeWrite 함수가 처리
      });
    } catch (e: any) { alert(e?.message || '참가 실패'); }
  };

  const leave = async () => {
    if (!id || !uid || !ev) return;
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'events', id);
        const att = doc(db, 'events', id, 'attendees', uid);
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error('존재하지 않는 모임');
        const data = snap.data() as EventDoc & { attendeeCount?: number };
        const count = data.attendeeCount ?? 0;
        const my = await tx.get(att);
        if (!my.exists()) return; // 이미 미참가
        tx.delete(att);
        // attendeeCount 업데이트는 onAttendeeWrite 함수가 처리
      });
    } catch (e: any) { alert(e?.message || '취소 실패'); }
  };

  const waitJoin = async ()=>{
    if(!id || !uid) return alert('로그인이 필요합니다');
    await setDoc(doc(db,'events',id,'waitlist', uid), { joinedAt: new Date() });
  };
  const waitCancel = async ()=>{
    if(!id || !uid) return;
    await deleteDoc(doc(db,'events',id,'waitlist', uid));
  };

  const muteOn = async ()=>{ if(!id||!uid) return; await setDoc(doc(db,'events',id,'mutes',uid), { at:new Date() }); };
  const muteOff = async ()=>{ if(!id||!uid) return; await deleteDoc(doc(db,'events',id,'mutes',uid)); };

  const pledge = async ()=>{
    if(!ev) return; 
    const amt = prompt('참가비(원)를 입력하세요', String(ev.fee || 0));
    if(!amt) return; 
    const call = httpsCallable(getFunctions(),'setPaymentIntent');
    await call({ eventId: ev.id, amount: Number(amt) });
    alert('참가비 의향이 저장되었습니다');
  };

  const pay = async ()=>{
    if(!ev) return;
    navigate(`/events/${ev.id}/checkout`);
  };

  const downloadICS = () => {
    if(!ev) return;
    const start = (ev.startAt as any)?.toDate?.() || new Date();
    const end = (ev.endAt as any)?.toDate?.() || new Date(start.getTime()+60*60*1000);
    const ics = makeICS({
      uid: ev.id,
      title: ev.title,
      start, end,
      location: ev.placeName || undefined,
      description: ev.description || undefined,
      rrule: (ev as any).rrule || undefined,
    });
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${ev.title}.ics`; a.click();
    URL.revokeObjectURL(url);
  };

  if (!ev) return (
    <div className="max-w-4xl mx-auto p-4">
      <Header id={id || ''} />
      <div className="mt-4 text-gray-500">불러오는 중...</div>
    </div>
  );

  const isHost = useMemo(()=> !!ev && uid===ev.hostId, [ev, uid]);
  const isOpen = ev?.status==='open';
  const left = Math.max(0, (ev?.capacity||0) - (ev?.attendeeCount||0));
  const isPast = !!ev?.startAt && (ev.startAt as any)?.toMillis?.() < Date.now();

  const tabs = useMemo(()=>{
    const arr = [
      { key:'overview', label:'개요' },
      { key:'community', label:'커뮤니티' },
      { key:'media', label:'미디어' },
      { key:'lineup', label:'라인업/투표' },
    ] as { key:string; label:string }[];
    if (ev?.esports?.enabled) arr.push({ key:'esports', label:'e스포츠' });
    if (ev?.fee) arr.push({ key:'payment', label:'결제' });
    if (isStaff) arr.push({ key:'manage', label:'관리' });
    return arr;
  },[ev, isStaff]);
  const go = (k:string)=> setSp(p=>{ p.set('tab',k); return p; }, { replace:true });

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <Header id={id!} />

      {/* 헤더 */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{ev.title}</h1>
        <div className="text-sm text-gray-600">
          {ev.startAt?.toDate ? ev.startAt.toDate().toLocaleString() : ''} · {ev.placeName}
        </div>
        <div className="text-sm">정원 {ev.capacity} · 잔여 {left}</div>
      </header>

      {/* 탭 네비게이션 */}
      <nav className="flex gap-2 border-b pb-2">
        {tabs.map(t=> (
          <button key={t.key} onClick={()=>go(t.key)}
            className={`px-3 py-2 rounded-xl ${tab===t.key?'bg-black text-white':'bg-gray-100'}`}>
            {t.label}
          </button>
        ))}
      </nav>

      {/* 탭 컨텐츠 */}
      {tab==='overview' && (
        <div className="space-y-4">
          {/* 메타 */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1">{ev.sport}</span>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1">{fmtKDT(ev.startAt)} 시작</span>
            {ev.placeName && <KakaoMapBadge placeName={ev.placeName} lat={ev.lat} lng={ev.lng} />}
            {ev.dongCode && <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1">동코드 {ev.dongCode}</span>}
            <span className="ml-auto text-gray-400">{ev.status}</span>
          </div>

          {/* 이미지 */}
          <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-gray-100">
            {ev.images?.[0] && <img src={ev.images[0]} alt={ev.title} className="h-full w-full object-cover" />}
          </div>

          {/* 설명 */}
          <section>
            <h2 className="text-lg font-semibold">소개</h2>
            <p className="mt-2 whitespace-pre-wrap text-gray-700">{ev.description || '설명 없음'}</p>
          </section>

          {/* 액션 */}
          <div className="sticky bottom-3 flex items-center gap-2 rounded-2xl border bg-white/90 p-3 shadow">
            <Link to="/events" className="px-4 py-2 rounded-xl border">목록</Link>
            <button onClick={muted? muteOff : muteOn} className="px-4 py-2 rounded-xl border">{muted? '🔔 알림 켜기' : '🔕 이 모임 알림 끄기'}</button>
            <button onClick={pledge} className="px-4 py-2 rounded-xl border">결제 의향</button>
            <button onClick={pay} className="px-4 py-2 rounded-xl bg-black text-white">결제하기</button>
            <button onClick={downloadICS} className="px-4 py-2 rounded-xl border">캘린더 저장(.ics)</button>
            {isHost ? (
              <Link to={`/events/${ev.id}/manage`} className="px-4 py-2 rounded-xl bg-black text-white">관리하기</Link>
            ) : joined ? (
              <button onClick={leave} className="px-4 py-2 rounded-xl border">참가 취소</button>
            ) : left>0 && isOpen && !isPast ? (
              <div className="flex flex-col gap-2">
                <button 
                  onClick={join} 
                  disabled={isBanned}
                  className={`px-4 py-2 rounded-xl ${isBanned ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-black text-white'}`}
                  title={isBanned ? banMessage : undefined}
                >
                  참가하기
                </button>
                {isBanned && (
                  <p className="text-xs text-red-600 text-center">
                    {banMessage}
                  </p>
                )}
                {strikeCount > 0 && !isBanned && (
                  <p className="text-xs text-orange-600 text-center">
                    현재 {strikeCount}회 노쇼 경고 (3회 시 참가 제한)
                  </p>
                )}
              </div>
            ) : (
              wait ?
                <button onClick={waitCancel} className="px-4 py-2 rounded-xl border">대기 취소</button> :
                <button onClick={waitJoin} disabled={!isOpen || isPast || isBanned} className="px-4 py-2 rounded-xl border">대기 신청</button>
            )}
          </div>
        </div>
      )}
      {tab==='community' && (
        <div className="space-y-4">
          <QuickActions eventId={ev.id}/>
          <PostList eventId={ev.id}/>
        </div>
      )}
      {tab==='media' && <MediaGrid eventId={ev.id}/>}
      {tab==='esports' && ev.esports?.gameId && (
        <div className="space-y-3">
          <div className="text-sm text-gray-600">게임: {ev.esports.gameId}</div>
          <EventEsportsTab gameId={ev.esports.gameId} />
        </div>
      )}
      {tab==='payment' && (
        <div className="p-4 rounded-xl border space-y-3">
          <div className="text-sm">참가비: {(ev.fee||0).toLocaleString()}원</div>
          <button
            onClick={()=>navigate(`/events/${ev.id}/checkout`)}
            className="px-4 py-2 rounded-xl bg-black text-white">
            결제하기
          </button>
        </div>
      )}
      {tab==='lineup' && <LineupTab eventId={ev.id} evTitle={ev.title} />}
      {tab==='manage' && isStaff && (<ManageTab eventId={ev.id} />)}
    </div>
  );
}

const Header: React.FC<{ id: string }> = ({ id }) => (
  <div className="flex items-center gap-3">
    <Link to="/events" className="text-sm text-blue-600 underline">← 모임</Link>
    <span className="text-xs text-gray-400">ID: {id}</span>
  </div>
);

