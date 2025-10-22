import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function ClubBlogPending() {
  const { clubId } = useParams();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const approve = httpsCallable(functions, "approvePendingBlog");

  useEffect(() => {
    if (!clubId) return;
    
    (async () => {
      setLoading(true);
      try {
        const q = query(collection(db, `clubs/${clubId}/blogPending`), orderBy("createdAt", "desc"));
        const s = await getDocs(q);
        setItems(s.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error('대기열 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [clubId]);

  const onClick = async (id: string, ok: boolean) => {
    if (!clubId) return;
    
    try {
      const r: any = await approve({ clubId, pendingId: id, approve: ok });
      alert(ok ? "승인되었습니다!" : "반려되었습니다.");
      // 목록 새로고침
      window.location.reload();
    } catch (error: any) {
      console.error('승인/반려 오류:', error);
      alert(`처리 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">대기열을 불러오는 중...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">AI 글 대기열</h1>
      <div className="space-y-3">
        {items.map(p => (
          <div key={p.id} className="border rounded p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="font-semibold">{p.title}</div>
                <div className="text-sm text-gray-500 mb-2">
                  {p.sport} • {p.createdAt?.toDate?.()?.toLocaleString() || '날짜 없음'}
                </div>
                {p.summary && (
                  <div className="text-sm text-gray-600 mb-2">{p.summary}</div>
                )}
                {p.tags && p.tags.length > 0 && (
                  <div className="flex gap-1 mb-2">
                    {p.tags.map((tag: string, i: number) => (
                      <span key={i} className="px-2 py-1 text-xs bg-gray-100 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button 
                  onClick={() => onClick(p.id, true)} 
                  className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                >
                  승인
                </button>
                <button 
                  onClick={() => onClick(p.id, false)} 
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                >
                  반려
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {p.content}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-gray-500 text-center py-8">대기 중인 글이 없습니다.</div>
        )}
      </div>
    </div>
  );
}
