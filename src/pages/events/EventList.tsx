import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, limit, onSnapshot, startAfter, getDocs, QueryDocumentSnapshot, DocumentData, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { fmtKDT } from '@/lib/date';

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
  images: string[];
  hostId: string;
  attendeeCount: number;
  description?: string;
}

const SPORTS = ['전체', '축구', '농구', '배드민턴', '테니스', '런닝', '기타'];

export default function EventList() {
  const [items, setItems] = useState<(EventDoc & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState('전체');
  const [snapshots, setSnapshots] = useState<QueryDocumentSnapshot<DocumentData>[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  useEffect(() => {
    console.log('EventList useEffect triggered, sport:', sport);
    setLoading(true);
    const now = new Date(); // 오늘 이후만
    const base = collection(db, 'events');
    const baseQ =
      sport === '전체'
        ? query(
            base,
            where('status', '==', 'open'),
            where('startAt', '>=', now)       // ✅ 과거 숨김
          )
        : query(
            base,
            where('status', '==', 'open'),
            where('sport', '==', sport),
            where('startAt', '>=', now)       // ✅ 과거 숨김
          );

    const q = query(baseQ, orderBy('startAt', 'asc'), limit(12));
    console.log('Query created:', q);

    const unsub = onSnapshot(
      q,
      (s) => {
        const arr = s.docs.map(d => ({ id: d.id, ...(d.data() as EventDoc) }));
        setItems(arr);
        setSnapshots(s.docs);
        setCursor(s.docs.length ? s.docs[s.docs.length - 1] : null);
        setLoading(false);
      },
      async (err) => {
        console.error('Firestore query error:', err);
        if (err?.code === 'failed-precondition') {
          // 🔧 인덱스 준비 전 폴백
          try {
            const s = await getDocs(baseQ);
            const arr = s.docs
              .map(d => ({ id: d.id, ...(d.data() as EventDoc) }))
              .sort((a,b) => (a.startAt?.toMillis?.() ?? 0) - (b.startAt?.toMillis?.() ?? 0));
            setItems(arr);
            setSnapshots(s.docs);
            setCursor(null);
          } catch (fallbackErr) {
            console.error('Fallback query failed:', fallbackErr);
            setItems([]);
            setSnapshots([]);
            setCursor(null);
          }
        } else {
          // 다른 에러의 경우에도 빈 배열로 설정
          setItems([]);
          setSnapshots([]);
          setCursor(null);
        }
        setLoading(false);
      }
    );
    return () => unsub();
  }, [sport]);

  const loadMore = async () => {
    if (!cursor) return;
    const now = new Date(); // 오늘 이후만
    const base = collection(db, 'events');
    const q = sport === '전체'
      ? query(base, where('status', '==', 'open'), where('startAt', '>=', now), orderBy('startAt', 'asc'), startAfter(cursor), limit(12))
      : query(base, where('status', '==', 'open'), where('sport', '==', sport), where('startAt', '>=', now), orderBy('startAt', 'asc'), startAfter(cursor), limit(12));
    const s = await getDocs(q);
    const more = s.docs.map(d => ({ id: d.id, ...(d.data() as EventDoc) }));
    setItems(prev => [...prev, ...more]);
    setSnapshots(prev => [...prev, ...s.docs]);
    setCursor(s.docs.length ? s.docs[s.docs.length - 1] : null);
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">모임</h1>
        <div className="ml-auto" />
        <Link to="/events/new" className="px-3 py-2 rounded-xl bg-black text-white">모임 만들기</Link>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto">
        {SPORTS.map(s => (
          <button key={s} onClick={() => setSport(s)}
            className={`px-3 py-1.5 rounded-full border ${sport === s ? 'bg-black text-white' : 'bg-white'}`}>{s}</button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 text-gray-500">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="mt-6 text-gray-500">열린 모임이 없습니다.</div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {items.map(ev => (
            <Link key={ev.id} to={`/events/${ev.id}`} className="rounded-2xl border overflow-hidden hover:shadow">
              <div className="aspect-[4/3] bg-gray-100">
                {ev.images?.[0] && <img src={ev.images[0]} alt={ev.title} className="h-full w-full object-cover" />}
              </div>
              <div className="p-3">
                <div className="text-sm text-gray-500">{ev.sport} · {fmtKDT(ev.startAt)}</div>
                <div className="mt-1 font-semibold line-clamp-1">{ev.title}</div>
                <div className="mt-1 text-sm text-gray-600">
                  정원 {ev.capacity} · 참여 {ev.attendeeCount ?? 0}
                  {ev.capacity - (ev.attendeeCount ?? 0) <= 0 && (
                    <span className="ml-2 text-red-500 font-medium">정원 마감</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {cursor && (
        <div className="mt-6 text-center">
          <button onClick={loadMore} className="px-4 py-2 rounded-xl border">더 보기</button>
        </div>
      )}
    </div>
  );
}

