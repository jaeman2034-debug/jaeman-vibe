import React, { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  getCountFromServer,
  query,
  where,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import CategoryGrid from "@/components/category/CategoryGrid";
import { CATEGORIES } from "@/constants/categories";
import { useQueryParam } from "@/lib/useQuery";

// ---- 고정 요소들 (constants/categories.ts로 이동) ----

type Kpi = {
  users: number | null;
  products: number | null;
  clubs: number | null;
  jobs: number | null;
};

type Trend = {
  labels: string[];
  values: number[];
};

// ---------- 유틸 ----------
const fmtNumber = (n: number | null) =>
  n === null ? "-" : n.toLocaleString();

// 간단 SVG 스파크라인 (외부 라이브러리 없음)
const Sparkline: React.FC<{ values: number[]; width?: number; height?: number }> = ({
  values,
  width = 200,
  height = 60,
}) => {
  if (!values.length) return <div className="text-sm text-gray-400">데이터 없음</div>;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1 || 1)) * width;
    const y = height - (v / max) * (height - 6) - 3;
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height} className="block">
      <polyline
        points={pts.join(" ")}
        fill="none"
        strokeWidth={2}
        // 색상 지정하지 않음 (기본값)
        stroke="currentColor"
      />
    </svg>
  );
};

// 인증 이뮬레이터 체크
async function checkAuthEmulator(port = 9100): Promise<"emulator" | "prod" | "unknown"> {
  // 환경 변수나 로컬호스트 기반 추정
  const hinted =
    import.meta.env.VITE_USE_EMULATORS === "true" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "localhost";
  if (hinted) {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 800);
      const r = await fetch(`http://127.0.0.1:${port}/emulator/info`, {
        signal: ctl.signal,
      });
      clearTimeout(t);
      if (r.ok) return "emulator";
    } catch {}
  }
  return hinted ? "prod" : "unknown";
}

// ---------- 메인 페이지 ----------
const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const cat = useQueryParam("cat", ""); // 선택된 카테고리
  const [kpi, setKpi] = useState<Kpi>({
    users: null,
    products: null,
    clubs: null,
    jobs: null,
  });
  const [trend, setTrend] = useState<Trend>({ labels: [], values: [] });
  const [health, setHealth] = useState<"emulator" | "prod" | "unknown">("unknown");
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => new Date(), []);
  const sevenDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6); // 오늘 포함 7일
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // 1) KPI 카운트 (카테고리 필터 적용)
      async function countWithOptionalCat(col: string, catKey?: string, field: string = "categoryKey") {
        try {
          const base = collection(db, col);
          const snap = catKey
            ? await getCountFromServer(query(base, where(field, "==", catKey)))
            : await getCountFromServer(base);
          return snap.data().count ?? 0;
        } catch {
          return 0;
        }
      }
      const [users, products, clubs, jobs] = await Promise.all([
        countWithOptionalCat("users",    cat, "favCategories"), // TODO users의 즐겨찾기 기반(스키마에 맞춰 조정)
        countWithOptionalCat("products", cat, "categoryKey"),
        countWithOptionalCat("clubs",    cat, "sportKey"),
        countWithOptionalCat("jobs",     cat, "sportKey"),
      ]);
      setKpi({ users, products, clubs, jobs });

      // 2) 최근 7일 가입 추이 (users.createdAt 사용, 선택시 0)
      try {
        const q = query(
          collection(db, "users"),
          where("createdAt", ">=", Timestamp.fromDate(sevenDaysAgo))
        );
        const snap = await getDocs(q);
        // day key 만들기 (YYYY-MM-DD)
        const mm = new Map<string, number>();
        const cur = new Date(sevenDaysAgo);
        const labels: string[] = [];
        for (let i = 0; i < 7; i++) {
          const k = cur.toISOString().slice(0, 10);
          labels.push(k.slice(5)); // MM-DD
          mm.set(k, 0);
          cur.setDate(cur.getDate() + 1);
        }
        snap.forEach((doc) => {
          const d: any = doc.data();
          const ts: Timestamp | null = d?.createdAt ?? null;
          const dateStr = ts
            ? ts.toDate().toISOString().slice(0, 10)
            : today.toISOString().slice(0, 10);
          if (mm.has(dateStr)) mm.set(dateStr, (mm.get(dateStr) || 0) + 1);
        });
        setTrend({
          labels,
          values: labels.map((lab) => {
            const k = `${today.getFullYear()}-${lab}`;
            return mm.get(k) || 0;
          }),
        });
      } catch {
        setTrend({ labels: [], values: [] });
      }

      // 3) 헬스
      const h = await checkAuthEmulator(9100);
      setHealth(h);

      setLoading(false);
    })();
  }, [sevenDaysAgo, today]);

  const user = auth.currentUser;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">관리 대시보드</h1>
          <p className="text-sm text-muted-foreground">
            {cat ? `선택된 카테고리: #${cat}` : "전체 카테고리 기준"}
          </p>
        </div>
        {/* 배포/마켓/서버 버튼을 헤더에서 제거 */}
      </header>

      {/* 카테고리 (그리드) */}
      <CategoryGrid
        title="카테고리"
        categories={CATEGORIES as any}
        onSelect={(key) => navigate(`/dashboard?cat=${key}`)}
      />

      {/* KPI */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard title="가입자" sub="/users" value={fmtNumber(kpi.users)} icon="👥" />
        <KpiCard title="상품" sub="/products" value={fmtNumber(kpi.products)} icon="📦" />
        <KpiCard title="모임" sub="/clubs" value={fmtNumber(kpi.clubs)} icon="🏃" />
        <KpiCard title="구인구직" sub="/jobs" value={fmtNumber(kpi.jobs)} icon="💼" />
      </section>

      {/* 가입 추이 + 헬스 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="p-4 rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-white/10 h-44">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="font-semibold">최근 7일 신규 가입</h2>
            <span className="text-xs text-gray-500">
              {trend.labels.length ? `${trend.labels[0]} ~ ${trend.labels.at(-1)}` : "데이터 없음"}
            </span>
          </div>
          <div className="h-[120px] flex items-center text-gray-700 dark:text-gray-200">
            {trend.values.length ? <Sparkline values={trend.values} width={360} height={100} /> : 
              <div className="w-full border-t border-dashed border-gray-300" />}
          </div>
        </div>
        <div className="p-4 rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-white/10 h-44">
          <h2 className="font-semibold mb-2">시스템 상태</h2>
          <ul className="text-sm leading-7">
            <li>Auth: <b>{health === "emulator" ? "이뮬레이터" : health === "prod" ? "프로덕션" : "알 수 없음"}</b></li>
            <li>로그인: {user ? `✅ ${user.email ?? user.uid}` : "❌ 미로그인 상태"}</li>
            <li>호스트: {location.host}</li>
          </ul>
          <div className="mt-3 flex gap-2">
            <a className="btn" href="http://127.0.0.1:4001/" target="_blank" rel="noreferrer">Emulator UI</a>
          </div>
        </div>
      </section>

      {loading && (
        <div className="fixed bottom-4 right-4 px-3 py-2 rounded-xl bg-black/80 text-white text-sm shadow">
          로딩 중...
        </div>
      )}
    </div>
  );
};

// --- 프리미티브 카드 컴포넌트 ---
const KpiCard: React.FC<{ title: string; value: string | number; sub?: string; icon?: string }> = ({
  title,
  value,
  sub,
  icon,
}) => (
  <div className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-white/10 p-4 h-28 flex flex-col justify-between">
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{title}</span>
      {icon && <span className="text-lg">{icon}</span>}
    </div>
    <div>
      <div className="text-2xl font-bold leading-none">{value}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-1">{sub}</div>}
    </div>
  </div>
);

// --- 상태 배지 ---
const HealthBadge: React.FC<{ mode: "emulator" | "prod" | "unknown" }> = ({ mode }) => {
  const base = "px-3 py-1 rounded-full text-xs font-semibold border";
  const cls =
    mode === "emulator" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
    mode === "prod"     ? "bg-blue-50 text-blue-700 border-blue-200" :
                          "bg-gray-100 text-gray-600 border-gray-200";
  return <span className={`${base} ${cls}`} title="Auth 연결 상태">
    {mode === "emulator" ? "EMULATOR" : mode === "prod" ? "PROD" : "UNKNOWN"}
  </span>;
};

export default DashboardPage;