import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";

export default function ClubBlogHome() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [home, setHome] = useState<any>(null);
  
  const go = new URLSearchParams(location.search).get('go') || '';

  useEffect(() => {
    // clubId 검증: 실제 ID여야 하고 'select' 같은 기본값이면 안 됨
    if (!clubId || clubId === 'select' || clubId.length < 10) {
      console.warn('[ClubBlogHome] 잘못된 clubId:', clubId, '→ 선택 화면으로 리다이렉트');
      navigate(`/clubs/select${go ? `?go=${go}` : ''}`, { replace: true });
      return;
    }
    
    console.log('[ClubBlogHome] 올바른 clubId로 blogHome 구독:', clubId);
    // ✅ 올바른 문서 경로 (4개 세그먼트): clubs/{clubId}/pages/blogHome
    const u = onSnapshot(doc(db, 'clubs', clubId, 'pages', 'blogHome'), s => setHome(s.data() || null));
    return () => u();
  }, [clubId, go, navigate]);

  // ?go= 파라미터 처리 (페이지 로드 후 자동 이동)
  useEffect(() => {
    if (!go || !clubId || clubId === 'select') return;
    
    // go 파라미터가 있으면 해당 경로로 이동
    if (go === 'blog/new') {
      navigate(`/clubs/${clubId}/blog/new`, { replace: true });
    } else if (go.startsWith('blog/')) {
      navigate(`/clubs/${clubId}/${go}`, { replace: true });
    }
  }, [go, clubId, navigate]);

  const latest = home?.latest || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      {/* Hero */}
      <div className="rounded-2xl overflow-hidden shadow">
        {home?.heroUrl ? (
          <img src={home.heroUrl} className="w-full max-h-[420px] object-cover" alt="hero" />
        ) : (
          <div className="w-full h-[220px] bg-gray-100 flex items-center justify-center text-gray-400">
            대표 이미지가 곧 생성됩니다…
          </div>
        )}
      </div>

      {/* 태그 모음 */}
      <div className="flex flex-wrap gap-2">
        {(home?.tags || []).map((t:any) => (
          <Link key={t.name} to={`/clubs/${clubId}/blog?tag=${encodeURIComponent(t.name)}`}
            className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-sm">
            #{t.name} <span className="text-gray-500">({t.count})</span>
          </Link>
        ))}
      </div>

      {/* 최신 글 */}
      <div className="grid md:grid-cols-2 gap-4">
        {latest.map((p:any) => (
          <Link key={p.id} to={`/clubs/${clubId}/blog/${p.id}`} className="border rounded-xl overflow-hidden hover:shadow group">
            {p.heroUrl && <img src={p.heroUrl} className="w-full h-44 object-cover" alt="" />}
            <div className="p-4">
              <div className="font-semibold group-hover:underline">{p.title}</div>
              <div className="text-sm text-gray-500 line-clamp-2 mt-1">{p.summary}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
