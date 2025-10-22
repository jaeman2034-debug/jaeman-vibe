import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getFirestore, doc, getDoc, collection, query, where, orderBy, getDocs, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function ClubBlogIndex() {
  const { clubId = "" } = useParams();
  const nav = useNavigate();
  const db = getFirestore();
  const [blog, setBlog] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const { currentUser } = getAuth();

  useEffect(() => {
    (async () => {
      // 클럽 정보에서 블로그 제목 가져오기
      const clubDoc = await getDoc(doc(db, "clubs", clubId));
      if (clubDoc.exists()) {
        setBlog({ title: `${clubDoc.data().name} 공식 블로그` });
        
        // 관리자 권한 확인
        const { currentUser } = getAuth();
        if (currentUser) {
          const clubData = clubDoc.data();
          const isOwner = clubData.ownerUid === currentUser.uid;
          const isAdminUser = clubData.admins && clubData.admins[currentUser.uid] === true;
          setIsAdmin(isOwner || isAdminUser);
        }
      }
      
      // clubs/{clubId}/blog 컬렉션에서 발행된 포스트만 가져오기
      const postsCol = collection(db, "clubs", clubId, "blog");
      const q = query(
        postsCol,
        // ⚠️ 우선 필터 없이 확인하고, 확인되면 아래 where를 다시 켜세요.
        // where("published", "==", true), // 공개된 글만 표시
        orderBy("createdAt", "desc")
      );
      const ps = await getDocs(q);
      setPosts(ps.docs.map(d => ({ id: d.id, ...d.data() })));
    })();
  }, [db, clubId]);

  // 글 삭제 핸들러
  const handleDelete = async (postId: string) => {
    if (!confirm('이 글을 삭제할까요?')) return;
    try {
      await deleteDoc(doc(db, `clubs/${clubId}/blog/${postId}`));
      alert('글이 삭제되었습니다.');
      // 목록 새로고침
      window.location.reload();
    } catch (error) {
      console.error('Delete error:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 작성자/관리자 확인
  const canEdit = (post: any) => {
    if (!currentUser) return false;
    return isAdmin || post.authorUid === currentUser.uid;
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{blog?.title ?? "블로그"}</h1>
        {isAdmin && (
          <button
            onClick={() => nav(`/clubs/${clubId}/blog/new`)}
            className="px-3 py-1.5 border rounded text-sm bg-blue-500 text-white"
          >
            새 글 쓰기
          </button>
        )}
      </div>
      <div className="mt-4 space-y-3">
        {posts.map(p => (
          <div key={p.id} className="border rounded p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Link 
                  to={`/clubs/${clubId}/blog/${p.id}`}
                  className="font-semibold text-blue-600 hover:text-blue-800"
                >
                  {p.title}
                </Link>
                <div className="text-sm text-gray-600 mt-1">
                  {p.content?.substring(0, 100)}...
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {p.createdAt?.toDate?.()?.toLocaleDateString() || '날짜 없음'}
                </div>
              </div>
              {canEdit(p) && (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => nav(`/clubs/${clubId}/blog/${p.id}/edit`)}
                    className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="px-2 py-1 text-xs border rounded text-red-600 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {posts.length === 0 && <div className="text-gray-500">아직 게시글이 없어요.</div>}
      </div>
    </div>
  );
}
