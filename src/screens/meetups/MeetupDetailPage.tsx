import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Meta } from '../../components/seo/Meta';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { JoinTypePicker, JoinTypePickerDynamic, type JoinBucket } from '../../components/meetups/JoinTypePicker';
import { readUtmSource } from '../../utils/utm';

interface Ticket {
  id: string;
  qrPngUrl: string;
  checkinUrl: string;
}

export default function MeetupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { user: currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [joining, setJoining] = useState(false);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [bucket, setBucket] = useState<string>('default');
  const [buckets, setBuckets] = useState<any[]>([{ key: 'default', label: '일반' }]);
  const [promo, setPromo] = useState<string | null>(null);
  const [capacity, setCapacity] = useState<{
    capacity: { [key: string]: number };
    paid: { [key: string]: number };
    pending: { [key: string]: number };
    waitlist: { [key: string]: number };
  } | null>(null);
  const [teams, setTeams] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const snap = await getDoc(doc(db, 'meetups', id));
      setItem(snap.data());
      const asnap = await getDocs(collection(db, 'meetups', id, 'attendees'));
      setAttendees(asnap.docs.map(d=>({ id:d.id, ...d.data() })));
      setLoading(false);
    })(); 
  }, [id, db]);

  // 승급 토큰 쿼리 파라미터 확인
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const promoToken = urlParams.get('promo');
    if (promoToken) {
      setPromo(promoToken);
    }
  }, []);

  // 버킷 정보 로드
  useEffect(() => {
    (async () => {
      if (!item) return;
      const j = await (await fetch(`/api/meetups/${item.id}/buckets`)).json();
      setBuckets(j.items || [{ key: 'default', label: '일반' }]);
    })();
  }, [item?.id]);

  // 용량 정보 로드
  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const response = await fetch(`/api/meetups/${id}/capacity`);
        if (response.ok) {
          const data = await response.json();
          setCapacity(data);
        }
      } catch (e) {
        console.error('Failed to load capacity:', e);
      }
    })();
  }, [id]);

  // 팀 정보 로드
  useEffect(() => {
    (async () => {
      if (!item?.teams || !Array.isArray(item.teams) || item.teams.length === 0) return;
      
      try {
        const teamPromises = item.teams.map(async (teamId: string) => {
          const response = await fetch(`/api/teams/${teamId}?clubId=${item.clubId}`);
          if (response.ok) {
            const data = await response.json();
            return data.team;
          }
          return null;
        });
        
        const teamData = await Promise.all(teamPromises);
        setTeams(teamData.filter(Boolean));
      } catch (e) {
        console.error('Failed to load teams:', e);
      }
    })();
  }, [item?.teams, item?.clubId]);

  const isHost = useMemo(()=> currentUser && item?.hostUid === currentUser.uid, [item, currentUser]);
  const mine = useMemo(()=> currentUser && attendees.some(a=>a.id===currentUser.uid), [attendees, currentUser]);
  const count = attendees.length;
  const full = item?.capacity && count >= item.capacity;

  const join = async () => {
    if (!currentUser) return alert('로그인이 필요합니다');
    if (full) return alert('정원이 가득 찼습니다');
    await setDoc(doc(db,'meetups', id!, 'attendees', currentUser.uid), {
      joinedAt: serverTimestamp(),
      displayName: currentUser.displayName || '참가자',
      uid: currentUser.uid,
    }, { merge: true });
    setAttendees(prev => ([...prev.filter(a=>a.id!==currentUser.uid), { id: currentUser.uid }]));
    try{
      const hook = (import.meta as any).env.VITE_N8N_WEBHOOK_MEETUP_RSVP;
      if (hook) {
        await fetch(hook, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ meetupId: id, uid: currentUser.uid, action: 'join' }) });
      }
    }catch{}
  };

  // 승급 토큰 처리
  const acceptPromo = async () => {
    if (!promo || !item) return;
    setJoining(true);
    try {
      const r = await fetch('/waitlist/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: promo,
          meetupId: item.id || id,
          user: { name: currentUser?.displayName || 'Guest' }
        })
      });
      const j = await r.json();
      if (!r.ok) return alert('승급 링크가 만료되었습니다');
      
      // 승급 성공 시 해당 버킷으로 참가
      setBucket(j.bucket);
      await handleJoinWithBucket(j.bucket);
    } catch (e: any) {
      alert('승급 처리 중 오류가 발생했습니다: ' + e.message);
    } finally {
      setJoining(false);
    }
  };

  const leave = async () => {
    if (!currentUser) return;
    await deleteDoc(doc(db,'meetups', id!, 'attendees', currentUser.uid));
    setAttendees(prev => prev.filter(a=>a.id!==currentUser.uid));
    try{
      const hook = (import.meta as any).env.VITE_N8N_WEBHOOK_MEETUP_RSVP;
      if (hook) {
        await fetch(hook, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ meetupId: id, uid: currentUser.uid, action: 'leave' }) });
      }
    }catch{}
  };

  // 버킷별 참가 함수
  const handleJoinWithBucket = async (targetBucket: string) => {
    if (!item) return;
    setJoining(true);
    try {
      const amt = item.price?.amount || 0;
      if (amt > 0) {
        // 유료: 결제 체크아웃
        const body = { 
          meetupId: item.id || id, 
          user: { 
            name: currentUser?.displayName || 'Guest',
            uid: currentUser?.uid || 'anonymous'
          }, 
          provider: 'toss', 
          amount: amt, 
          eventStart: item.dateStart, 
          eventEnd: item.dateEnd || item.dateStart + 2*60*60*1000, 
          title: item.title,
          bucket: targetBucket,
          utm: { source: readUtmSource() }
        };
        const resp = await fetch('/payments/checkout', { 
          method:'POST', 
          headers:{ 'Content-Type':'application/json' }, 
          body: JSON.stringify(body) 
        });
        const data = await resp.json();
        if (!resp.ok) {
          if (data?.waitlistRecommended) {
            if (confirm('정원이 가득 찼습니다. 대기열에 등록할까요?')) {
              // 대기열 등록을 위한 무료 RSVP 호출
              const waitlistResp = await fetch('/reserve', { 
                method:'POST', 
                headers:{ 'Content-Type':'application/json' }, 
                body: JSON.stringify({ 
                  meetupId: item.id || id, 
                  user: { 
                    name: currentUser?.displayName || 'Guest',
                    uid: currentUser?.uid || 'anonymous'
                  }, 
                  amount: 0,
                  eventStart: item.dateStart, 
                  eventEnd: item.dateEnd,
                  bucket: targetBucket
                }) 
              });
              const waitlistData = await waitlistResp.json();
              if (waitlistData.waitlisted) {
                alert(`대기열에 등록되었습니다. 현재 순번: ${waitlistData.position}`);
                // 용량 정보 새로고침
                const capacityResp = await fetch(`/api/meetups/${id}/capacity`);
                if (capacityResp.ok) {
                  const capacityData = await capacityResp.json();
                  setCapacity(capacityData);
                }
              }
            }
            return;
          }
          throw new Error(data?.error || 'checkout failed');
        }
        location.href = data.redirectUrl;
      } else {
        // 무료: 즉시 RSVP 발급
        const resp = await fetch('/reserve', { 
          method:'POST', 
          headers:{ 'Content-Type':'application/json' }, 
          body: JSON.stringify({ 
            meetupId: item.id || id, 
            user: { 
              name: currentUser?.displayName || 'Guest',
              uid: currentUser?.uid || 'anonymous'
            }, 
            eventStart: item.dateStart, 
            eventEnd: item.dateEnd,
            bucket: targetBucket,
            utm: { source: readUtmSource() }
          }) 
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data?.error || 'reserve failed');
        
        if (data.waitlisted) {
          alert(`정원이 가득 찼습니다. 대기열 등록 완료 (순번: ${data.position})`);
          // 용량 정보 새로고침
          const capacityResp = await fetch(`/api/meetups/${id}/capacity`);
          if (capacityResp.ok) {
            const capacityData = await capacityResp.json();
            setCapacity(capacityData);
          }
        } else {
          setTicket({ 
            id: data.reservationId, 
            qrPngUrl: data.qrPngUrl, 
            checkinUrl: data.checkinUrl 
          });
        }
      }
    } catch (e: any) { 
      alert(e.message); 
    }
    finally { 
      setJoining(false); 
    }
  };

  // 무료/유료 자동 분기 참가 함수
  const handleJoin = async () => {
    await handleJoinWithBucket(bucket);
  };

  if (loading || !item) return <div className="p-4">로딩 중…</div>;

  const start = item.timeStart?.seconds ? new Date(item.timeStart.seconds*1000) : new Date(item.timeStart);
  const end = item.timeEnd?.seconds ? new Date(item.timeEnd.seconds*1000) : item.timeEnd ? new Date(item.timeEnd) : undefined;

  // OG 이미지 URL 생성 (버킷별 배지 추가)
  const badges = bucket === 'women' ? 'women_only' : bucket === 'u10' ? 'U10' : '';
  const ogImageUrl = `/og?title=${encodeURIComponent(item.title)}&subtitle=${encodeURIComponent(item.description || item.subtitle || '')}&sport=${item.sport || ''}&club=${encodeURIComponent('YAGO FC')}&date=${encodeURIComponent(start.toLocaleString())}&bg=sport&badges=${badges}`;

  // JSON-LD 스키마
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: item.title,
    startDate: start.toISOString(),
    endDate: end ? end.toISOString() : new Date(start.getTime() + 2*60*60*1000).toISOString(),
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: item.place?.name ? { '@type': 'Place', name: item.place.name } : undefined,
    organizer: { '@type': 'Organization', name: 'YAGO SPORTS' },
    offers: item.price ? { 
      '@type': 'Offer', 
      price: item.price.amount, 
      priceCurrency: item.price.currency || 'KRW', 
      availability: 'https://schema.org/InStock' 
    } : undefined
  };

  return (
    <>
      <Meta
        title={`${item.title} — YAGO`}
        description={item.description || item.subtitle || `${item.place?.name || ''} · ${start.toLocaleString()}`}
        ogImage={ogImageUrl}
        url={typeof window !== 'undefined' ? window.location.href : ''}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      <div className="mx-auto max-w-3xl px-4 py-6 flex flex-col gap-6">
      <button className="text-sm text-gray-500" onClick={()=>nav('/meetups')}>← 목록으로</button>
      
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{item.title}</h1>
          <div className="flex items-center gap-2">
            {item.price?.amount ? (
              <span className="px-2 py-1 rounded-lg bg-zinc-900 text-white text-sm">₩{(item.price.amount).toLocaleString()}</span>
            ) : (
              <span className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-sm">무료</span>
            )}
            {capacity && (
              <span className={`px-2 py-1 rounded-lg text-sm ${
                (capacity.paid?.default || 0) + (capacity.pending?.default || 0) >= (capacity.capacity?.default || Infinity)
                  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' 
                  : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
              }`}>
                {(capacity.paid?.default || 0) + (capacity.pending?.default || 0)}/{capacity.capacity?.default || '∞'}
                {(capacity.waitlist?.default || 0) > 0 && ` +${capacity.waitlist.default} 대기`}
              </span>
            )}
          </div>
        </div>
        <div className="text-sm text-zinc-600 dark:text-zinc-300">{item.description || item.subtitle}</div>
        
        {/* 참가 팀 배지 */}
        {teams.length > 0 && (
          <div className="flex gap-2 mt-2">
            {teams.map((team: any) => (
              <a 
                key={team.id} 
                href={`/clubs/${item.clubId}/teams/${team.id}`}
                className="text-xs px-2 py-1 rounded-full border hover:bg-gray-50 dark:hover:bg-zinc-800"
              >
                🏆 {team.name}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* 히어로/요약 */}
      <div className="rounded-2xl bg-white/90 dark:bg-zinc-900 p-4 shadow">
        <div className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <div>카테고리: <b>{item.category || '모임'}</b> {item.sport ? `· ${item.sport}` : ''}</div>
          <div>장소: <b>{item.place?.name}</b></div>
          <div>일시: <b>{start.toLocaleString()} {end ? ` ~ ${end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`: ''}</b></div>
          <div>참가비: <b>{item.price ? `${item.price.amount?.toLocaleString()} ${item.price.currency}` : '무료'}</b></div>
          <div>정원: <b>{count} / {item.capacity || '-'} {full && <span className="ml-1 text-red-600 text-sm">(마감)</span>}</b></div>
        </div>
        {/* 참가 유형 선택 */}
        <div className="mt-3">
          <div className="text-sm mb-1 text-zinc-500">참가 유형</div>
          <JoinTypePickerDynamic buckets={buckets} value={bucket} onChange={setBucket} />
          {capacity && (
            <div className="text-xs text-zinc-500 mt-1">
              {buckets.map(b => (
                <span key={b.key}>
                  {b.label} {((capacity.paid?.[b.key] || 0) + (capacity.pending?.[b.key] || 0))}/{capacity.capacity?.[b.key] || '∞'}
                  {buckets.indexOf(b) < buckets.length - 1 ? ' · ' : ''}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 flex gap-2">
          {!mine ? (
            promo ? (
              <button 
                disabled={joining} 
                onClick={acceptPromo} 
                className="rounded-xl px-4 py-2 bg-emerald-600 text-white hover:opacity-90 disabled:opacity-50"
              >
                {joining ? '처리 중…' : '승급 좌석 확보하기'}
              </button>
            ) : (
              <button 
                disabled={joining || full} 
                onClick={handleJoin} 
                className="rounded-xl px-4 py-2 bg-black text-white hover:opacity-90 disabled:opacity-50"
              >
                {joining ? '처리 중…' : '참가하기'}
              </button>
            )
          ) : (
            <button className="btn" onClick={leave}>참여 취소</button>
          )}
          <Link className="btn" to={`/meetups/${id}/bench`}>벤치모드</Link>
          {isHost && (
            <span className="text-xs text-gray-500 self-center">* 주최자</span>
          )}
        </div>
      </div>

      {/* 참석자 목록 */}
      <div className="rounded-2xl border bg-white p-4">
        <div className="text-sm text-gray-500 mb-2">참석자({count})</div>
        <div className="flex flex-wrap gap-2">
          {attendees.length ? attendees.map(a => (
            <span key={a.id} className="px-2 py-1 rounded-full bg-gray-100 text-sm">{a.displayName || a.id.slice(0,6)}</span>
          )) : <span className="text-gray-400 text-sm">아직 없음</span>}
        </div>
      </div>

      {/* 티켓 모달 */}
      {ticket && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-[360px] shadow-xl flex flex-col items-center gap-3">
            <div className="text-lg font-bold">참가 티켓</div>
            <img src={ticket.qrPngUrl} alt="ticket-qr" className="w-40 h-40" />
            <div className="text-xs break-all text-center text-zinc-500">{ticket.checkinUrl}</div>
            <div className="flex gap-2 pt-1">
              <a 
                href={ticket.checkinUrl} 
                target="_blank" 
                className="px-3 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200"
              >
                체크인 URL 열기
              </a>
              <button 
                onClick={() => setTicket(null)} 
                className="px-3 py-2 rounded-lg bg-black text-white hover:opacity-90"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
