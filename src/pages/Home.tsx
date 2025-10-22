import { Link, useNavigate } from "react-router-dom";
import QuickNav from '@/components/QuickNav';

export default function Home() {
  const nav = useNavigate();
  
  return (
    <div className="space-y-6">
      <QuickNav />
      
      {/* Hero */}
      <section className="card">
        <h2 className="text-2xl md:text-3xl font-extrabold">?�포츠의 ?�작, ?�고</h2>
        <p className="mt-2 text-slate-600">
          AI 기반 추천�??�성 ?�터?�이?�로 마켓/모임/구자리�? ?�곳?�서
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/market" className="btn-primary">?�포츠마�?/Link>
          <Link to="/market/create" className="btn-secondary">?�품 ?�록</Link>
          <Link to="/groups" className="btn-ghost">모임 찾기</Link>
          <Link to="/jobs" className="btn-ghost">구인·구직</Link>
        </div>
      </section>
      
      {/* 카테고리 카드 그리??*/}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/market" className="card hover:shadow-2xl transition">
          <h3 className="text-lg font-semibold">?�포츠마�?/h3>
          <p className="mt-1 text-sm text-slate-600">?�품 ?�록/검??AI 추천 ?�스??/p>
          <div className="mt-3">
            <Link
              to="/market/create"
              className="text-sm text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              ?�품 ?�록?�기 ??
            </Link>
          </div>
        </Link>
        
        <Link to="/jobs" className="card hover:shadow-2xl transition">
          <h3 className="text-lg font-semibold">구인·구직</h3>
          <p className="mt-1 text-sm text-slate-600">코치/?�레?�너/?�판 채용 보드</p>
          <div className="mt-3">
            <Link
              to="/jobs/create"
              className="text-sm text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              채용 공고 ?�록 ??
            </Link>
          </div>
        </Link>
        
        <Link to="/meetups" className="card hover:shadow-2xl transition">
          <h3 className="text-lg font-semibold">모임</h3>
          <p className="mt-1 text-sm text-slate-600">지??�� ?�포�?모임/매칭</p>
          <div className="mt-3">
            <Link
              to="/meetups/new"
              className="text-sm text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              모임 만들�???
            </Link>
          </div>
        </Link>
      </section>
    </div>
  );
}
