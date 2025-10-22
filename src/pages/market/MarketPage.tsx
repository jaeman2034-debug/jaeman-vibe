import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import {
  collection, getDocs, limit, orderBy, query,
  where, startAfter, QueryDocumentSnapshot, DocumentData
} from "firebase/firestore";
import MarketItemCard from "@/features/market/MarketItemCard";
import FlowNext from "@/components/FlowNext";
import AppLayout from "@/components/layout/AppLayout";

export default function MarketPage() {
  const nav = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

  // 필터 상태 (예시)
  const dongCode = "KR-41411560";
  const [status, setStatus] = useState<"all"|"selling"|"reserved"|"sold">("selling");
  const [includeSold, setIncludeSold] = useState(false);
  const [category, setCategory] = useState<"전체"|"축구화"|"유니폼"|"공"|"기타">("전체");
  const [keyword, setKeyword] = useState("");

  const baseQuery = useMemo(() => {
    const clauses:any[] = [
      where("published","==",true),
      where("dongCode","==",dongCode),
      orderBy("createdAt","desc"),
      limit(10),
    ];
    // 상태 필터
    if (status === "all") {
      if (!includeSold) {
        // '전체 + 판매완료 제외' -> IN 쿼리
        clauses.splice(2,0, where("status","in",["selling","reserved"]));
      }
    } else {
      clauses.splice(2,0, where("status","==",status));
    }
    // 카테고리
    if (category !== "전체") {
      clauses.splice(2,0, where("category","==",category));
    }
    return query(collection(db,"market"), ...clauses);
  }, [dongCode, status, includeSold, category]);

  async function loadMore(first=false) {
    if (loading || (done && !first)) return;
    setLoading(true);

    let q = baseQuery;
    if (!first && lastDocRef.current) {
      q = query(baseQuery, startAfter(lastDocRef.current));
    }

    const snap = await getDocs(q);
    if (snap.empty) {
      setDone(true);
      setLoading(false);
      return;
    }
    const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

    // 다음 페이지용 포인터
    lastDocRef.current = snap.docs[snap.docs.length - 1];

    setItems(first ? rows : [...items, ...rows]);
    setLoading(false);
  }

  useEffect(() => {
    // 필터가 바뀌면 처음부터 로드
    setItems([]); setDone(false); lastDocRef.current = null;
    loadMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseQuery]);

  // 하단 sentinel 감시(옵션: 자동 무한스크롤)
  const sentinelRef = useRef<HTMLDivElement|null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((ents) => {
      ents.forEach(e => {
        if (e.isIntersecting) loadMore();
      });
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [sentinelRef.current, loadMore]);

  // 키워드 필터
  const filtered = useMemo(() => {
    if (!keyword.trim()) return items;
    const kw = keyword.trim().toLowerCase();
    return items.filter((i) => i.title?.toLowerCase().includes(kw));
  }, [items, keyword]);

  return (
    <AppLayout>
      <FlowNext />
      <div className="mx-auto max-w-screen-sm p-4 pb-24">
        {/* 헤더 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-2xl font-bold">송산2동</div>
        <div className="flex gap-2">
          <button className="rounded-full p-2 hover:bg-neutral-100" aria-label="검색 열기">🔍</button>
          <button className="rounded-full p-2 hover:bg-neutral-100" aria-label="알림 보기">🔔</button>
          <button
            className="rounded-lg bg-neutral-900 px-3 py-1 text-white"
            onClick={() => nav("/app/market/new")}
          >
            글쓰기
          </button>
        </div>
      </div>

      {/* 검색 */}
      <div className="mb-3 flex gap-2">
        <input
          className="flex-1 rounded-lg border p-2"
          placeholder="상품명 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button className="rounded-lg border px-3" onClick={() => { /* 서버검색 붙이면 여기*/ }}>
          검색
        </button>
      </div>

      {/* 카테고리 */}
      <div className="mb-3 flex flex-wrap gap-2">
        {(["전체", "축구화", "유니폼", "공", "기타"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full border px-3 py-1 ${category === c ? "bg-black text-white" : ""}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* 상태 필터 */}
      <div className="mb-3 flex flex-wrap gap-2">
        {[
          { key: "all", label: "전체" },
          { key: "selling", label: "판매중" },
          { key: "reserved", label: "예약중" },
          { key: "sold", label: "판매완료" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setStatus(s.key as any)}
            className={`rounded-full border px-3 py-1 ${status === s.key ? "bg-black text-white" : ""}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 판매완료 포함 */}
      <label className="mb-2 flex items-center gap-2 text-sm text-neutral-600">
        <input type="checkbox" checked={includeSold} onChange={(e) => setIncludeSold(e.target.checked)} />
        판매완료 포함
      </label>

      {/* 정렬 컨트롤 */}
      <div className="flex gap-2 mb-4">
        <select className="px-3 py-2 rounded-xl border text-sm">
          <option>최신순</option>
          <option>가격↑</option>
          <option>가격↓</option>
          <option>거리</option>
        </select>
        <div className="ml-auto" />
      </div>

      {/* 리스트 - 2열 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-2 py-16 text-center text-neutral-400">조건에 맞는 결과가 없습니다.</div>
        ) : (
          filtered.map((it) => (
            <MarketItemCard key={it.id} item={it} onClick={() => nav(`/market/${it.id}`)} />
          ))
        )}
      </div>

      {/* sentinel */}
      <div ref={sentinelRef} className="h-12 flex items-center justify-center text-sm text-neutral-500">
        {loading ? "불러오는 중…" : (done ? "마지막입니다" : "아래로 스크롤하여 더 보기")}
      </div>

      {/* FAB */}
      <button
        onClick={() => nav("/market/new")}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-orange-500 text-white text-2xl shadow-lg"
        aria-label="글쓰기"
      >
        +
      </button>
      </div>
    </AppLayout>
  );
}