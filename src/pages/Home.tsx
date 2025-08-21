import { Link, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useModal } from "../components/ModalHost";
import { getUid } from "../lib/auth";
import { canAccessDev } from "../lib/devMode";
import Header from "../components/layout/Header";
import FooterNav from "../components/layout/FooterNav";
import FloatingMic from "../components/FloatingMic";
import RecommendGrid from "../features/recs/RecommendGrid";
import SearchAutocomplete from "../features/search/SearchAutocomplete";

// ✅ 프로젝트 라우트에 맞게 아래 경로만 필요 시 수정하세요
const ROUTES = {
  market: "/market",
  meetings: "/meet",
  jobs: "/jobs",
  sell: "/market/new",
  createMeet: "/meet/create",
  postJob: "/jobs/new",
  voiceHub: "/voice",
  voiceVAD: "/voice/vad",
  voiceASR: "/voice/asr",
  voiceSignup: "/voice/one-shot-signup",
} as const;

export default function Home() {
  const navigate = useNavigate();
  const { open } = useModal();
  const uid = getUid();
  const showDev = useMemo(() => uid && canAccessDev({ uid } as any), [uid]);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900 pb-16 md:pb-0">
      <Header />
      
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              스포츠인을 위한
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-cyan-500"> AI 기반 VIBE 플랫폼</span>
            </h1>
            <p className="mt-4 text-zinc-600 dark:text-zinc-300 max-w-xl">
              음성으로 탐색하고 빠르게 거래·모임·채용까지. 하나의 대시보드에서 모두 처리하세요.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <PrimaryButton onClick={() => navigate(ROUTES.market)} icon={<IconStore/>}>마켓 둘러보기</PrimaryButton>
              <GhostButton onClick={() => navigate(ROUTES.meetings)} icon={<IconUsers/>}>모임 찾기</GhostButton>
              <GhostButton onClick={() => navigate(ROUTES.jobs)} icon={<IconBriefcase/>}>구인·구직</GhostButton>
              <GhostButton onClick={() => open("voice:asr") } icon={<IconMic/>}>음성 실행</GhostButton>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[16/10] rounded-3xl border bg-white/70 dark:bg-zinc-950/60 backdrop-blur p-4 shadow-sm">
              <div className="h-full w-full grid grid-cols-3 gap-3">
                <DemoCard title="스포츠 마켓" to={ROUTES.market} icon={<IconStore/>} color="from-emerald-400 to-emerald-600"/>
                <DemoCard title="모임" to={ROUTES.meetings} icon={<IconUsers/>} color="from-sky-400 to-sky-600"/>
                <DemoCard title="구인·구직" to={ROUTES.jobs} icon={<IconBriefcase/>} color="from-violet-400 to-violet-600"/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 검색바 */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SearchAutocomplete onSubmit={(q) => navigate(`${ROUTES.market}?q=${encodeURIComponent(q)}`)} />
      </section>

      {/* 카테고리/바로가기 카드 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                 <ActionCard
         title="AI 상품 등록"
         desc="AI가 도와주는 스마트 등록"
         icon={<IconPlusBox/>}
         onClick={() => navigate('/ai/product')}
       />
       <ActionCard
         title="일반 상품 등록"
         desc="중고/새상품 빠른 등록"
         icon={<IconPlusBox/>}
         onClick={() => navigate(ROUTES.sell)}
       />
          <ActionCard
            title="모임 만들기"
            desc="운동 메이트 모집"
            icon={<IconCalendarPlus/>}
            onClick={() => navigate(ROUTES.createMeet)}
          />
          <ActionCard
            title="채용 공고 등록"
            desc="코치·트레이너 구인"
            icon={<IconBriefcase/>}
            onClick={() => navigate(ROUTES.postJob)}
          />
          <ActionCard
            title="음성으로 시작"
            desc="손대지 않고 탐색"
            icon={<IconMic/>}
            onClick={() => open("voice:asr")}
          />
        </div>
      </section>

      {/* 추천 섹션 (실데이터 연동) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-8 pb-16">
        <RecommendGrid title="🔥 인기 상품" collectionName="products" to="/market" />
        <RecommendGrid title="👥 요즘 뜨는 모임" collectionName="meetings" to="/meet" />
        <RecommendGrid title="💼 최신 채용" collectionName="jobs" to="/jobs" />
      </section>

      {/* DEV 전용: 개발 도구 */}
      {showDev && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="rounded-3xl border p-6 bg-white/70 dark:bg-zinc-950/60">
            <div className="flex items-center gap-2 mb-4">
              <IconSparkle/>
              <h2 className="text-xl font-bold">개발 도구</h2>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">운영 플로우와 분리된 DEV 전용 기능입니다.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <DevLink title="Voice Hub" to={ROUTES.voiceHub} />
              <DevLink title="VAD Test" to={ROUTES.voiceVAD} />
              <DevLink title="ASR Test" to={ROUTES.voiceASR} />
              <DevLink title="One‑Shot Signup" to={ROUTES.voiceSignup} />
            </div>
          </div>
        </section>
      )}

      <FloatingMic />
      <FooterNav />
    </div>
  );
}

/* ---------------------------- UI Components ---------------------------- */
function PrimaryButton({ children, onClick, icon }: { children: React.ReactNode; onClick?: () => void; icon?: React.ReactNode }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-zinc-900 text-white hover:bg-black transition shadow-sm">
      {icon}{children}
    </button>
  );
}

function GhostButton({ children, onClick, icon }: { children: React.ReactNode; onClick?: () => void; icon?: React.ReactNode }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 border hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
      {icon}{children}
    </button>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">{title}</h3>
      {action}
    </div>
  );
}

function DemoCard({ title, to, icon, color }: { title: string; to: string; icon: React.ReactNode; color: string }) {
  return (
    <Link to={to} className="group rounded-2xl border overflow-hidden relative">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-20 group-hover:opacity-30 transition`}/>
      <div className="p-4 h-full min-h-28 flex items-center gap-3">
        <span className="inline-grid place-items-center w-10 h-10 rounded-xl bg-white/70 dark:bg-white/10 border">{icon}</span>
        <div className="font-medium">{title}</div>
      </div>
    </Link>
  );
}

function ActionCard({ title, desc, icon, onClick }: { title: string; desc?: string; icon?: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="text-left rounded-2xl border p-4 hover:shadow-md transition bg-white/80 dark:bg-zinc-950/60">
      <div className="flex items-center gap-3">
        <span className="inline-grid place-items-center w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 border">{icon}</span>
        <div>
          <div className="font-semibold">{title}</div>
          {desc && <div className="text-sm text-zinc-600 dark:text-zinc-400">{desc}</div>}
        </div>
      </div>
    </button>
  );
}

function DevLink({ title, to }: { title: string; to: string }) {
  return (
    <Link to={to} className="rounded-xl border px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition inline-flex items-center gap-2">
      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"/>
      <span className="font-medium">{title}</span>
    </Link>
  );
}

function PlaceholderGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-2xl border bg-white/60 dark:bg-zinc-950/50" />
      ))}
    </div>
  );
}

function SearchBar({ onSubmit }: { onSubmit: (query: string) => void }) {
  return (
    <form
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        const q = new FormData(e.currentTarget).get("q")?.toString().trim() || "";
        onSubmit(q);
      }}
    >
      <input
        name="q"
        className="w-full rounded-2xl border px-4 py-3 pr-28 bg-white/80 dark:bg-zinc-950/60 placeholder:text-zinc-400"
        placeholder="상품, 모임, 직무를 검색해보세요"
      />
      <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700">
        검색
      </button>
    </form>
  );
}

/* ------------------------------ Icons (SVG) ----------------------------- */
function IconMic() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><path d="M12 1a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10a7 7 0 0 1-14 0"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
  );
}
function IconStore() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><path d="M3 9l1-5h16l1 5"/><path d="M5 22V9h14v13"/><path d="M9 13h6v9H9z"/></svg>
  );
}
function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  );
}
function IconBriefcase() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M2 13h20"/></svg>
  );
}
function IconPlusBox() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
  );
}
function IconCalendarPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>
  );
}
function IconSparkle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"><path d="M12 3l2.5 5L20 10.5 15 13l-3 6-3-6-5-2.5L9.5 8 12 3z"/></svg>
  );
} 