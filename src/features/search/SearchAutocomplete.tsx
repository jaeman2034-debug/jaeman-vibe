import { useEffect, useMemo, useRef, useState } from "react";
import { getFirestore, collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { debounce } from "../../lib/debounce";

export type Suggest = { id: string; type: "product" | "meeting" | "job"; title: string; href: string };

async function searchAll(text: string, max = 5): Promise<Suggest[]> {
  const db = getFirestore();
  const qtext = text.toLowerCase();
  const results: Suggest[] = [];

  // 🔎 keywords 필드를 활용한 고품질 검색
  const run = async (col: string, type: Suggest["type"]) => {
    const ref = collection(db, col);
    
    try {
      // 1. keywords 배열에서 정확한 매치 시도 (가장 높은 우선순위)
      const exactQuery = query(
        ref, 
        where("keywords", "array-contains", qtext),
        orderBy("createdAt", "desc"), 
        limit(10)
      );
      const exactSnap = await getDocs(exactQuery);
      exactSnap.forEach((d) => {
        const v = d.data() as any;
        results.push({ 
          id: d.id, 
          type, 
          title: v.title || v.name || "Untitled", 
          href: `/${col}/${d.id}` 
        });
      });

      // 2. 제목에서 부분 매치 (보조 검색)
      if (results.length < max) {
        const titleQuery = query(
          ref, 
          orderBy("createdAt", "desc"), 
          limit(20)
        );
        const titleSnap = await getDocs(titleQuery);
        titleSnap.forEach((d) => {
          const v = d.data() as any;
          const title: string = v.title || v.name || "Untitled";
          
          // 이미 추가된 항목은 제외
          if (results.some(r => r.id === d.id)) return;
          
          // 제목에서 부분 매치 확인
          if (title.toLowerCase().includes(qtext)) {
            results.push({ 
              id: d.id, 
              type, 
              title, 
              href: `/${col}/${d.id}` 
            });
          }
        });
      }
    } catch (error) {
      console.warn(`검색 오류 (${col}):`, error);
      // 에러 발생 시 fallback으로 간단한 검색
      const fallbackQuery = query(ref, orderBy("createdAt", "desc"), limit(10));
      const fallbackSnap = await getDocs(fallbackQuery);
      fallbackSnap.forEach((d) => {
        const v = d.data() as any;
        const title: string = v.title || v.name || "Untitled";
        if (title.toLowerCase().includes(qtext)) {
          results.push({ 
            id: d.id, 
            type, 
            title, 
            href: `/${col}/${d.id}` 
          });
        }
      });
    }
  };

  await Promise.all([
    run("products", "product"),
    run("meetings", "meeting"),
    run("jobs", "job"),
  ]);

  // 중복 제거 및 우선순위 정렬
  const uniqueResults = results.filter((item, index, self) => 
    index === self.findIndex(t => t.id === item.id)
  );

  return uniqueResults.slice(0, max);
}

export default function SearchAutocomplete({ onSubmit }: { onSubmit: (q: string) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Suggest[] | null>(null);
  const [active, setActive] = useState(0);
  const [searching, setSearching] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const doSearch = useMemo(() => debounce(async (text: string) => {
    if (!text.trim()) { 
      setItems(null); 
      setOpen(false);
      return; 
    }
    
    setSearching(true);
    try {
      const res = await searchAll(text, 8);
      setItems(res);
      setActive(0);
      setOpen(res.length > 0);
    } catch (error) {
      console.error("검색 오류:", error);
      setItems([]);
      setOpen(false);
    } finally {
      setSearching(false);
    }
  }, 300), []); // 300ms로 증가 (키워드 검색 최적화)

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, (items?.length || 1) - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
      if (e.key === "Enter")     { e.preventDefault(); const it = items?.[active]; if (it) location.href = it.href; else onSubmit(q); setOpen(false); }
      if (e.key === "Escape")    { setOpen(false); }
    };
    window.addEventListener("keydown", onDown);
    return () => window.removeEventListener("keydown", onDown);
  }, [open, items, active, q, onSubmit]);

  useEffect(() => {
    const handle = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div className="relative" ref={boxRef}>
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit(q); setOpen(false); }}
        className="relative"
      >
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); doSearch(e.target.value); }}
          className="w-full rounded-2xl border px-4 py-3 pr-28 bg-white/80 dark:bg-zinc-950/60 placeholder:text-zinc-400"
          placeholder="상품, 모임, 직무를 검색해보세요"
          onFocus={() => q && setOpen(true)}
        />
        <button 
          type="submit" 
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700"
        >
          {searching ? "🔍" : "검색"}
        </button>
      </form>

      {open && (
        <div className="absolute z-30 mt-2 w-full rounded-2xl border bg-white dark:bg-zinc-950 shadow">
          {searching ? (
            <div className="px-3 py-4 text-center text-sm text-zinc-500">
              🔍 검색 중...
            </div>
          ) : items && items.length > 0 ? (
            items.map((it, i) => (
              <a key={it.type + it.id}
                 href={it.href}
                 className={`block px-3 py-2 rounded-xl m-1 ${i === active ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}>
                <span className="text-xs mr-2 px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800">{labelOf(it.type)}</span>
                <span>{it.title}</span>
              </a>
            ))
          ) : (
            <div className="px-3 py-4 text-center text-sm text-zinc-500">
              검색 결과가 없습니다
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function labelOf(t: Suggest["type"]) {
  return t === "product" ? "상품" : t === "meeting" ? "모임" : "채용";
} 