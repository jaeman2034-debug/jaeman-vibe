import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, where, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '@/lib/firebase';

export default function ClubBlogList() {
  const { clubId } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState<any[]>([]);
  const uid = auth.currentUser?.uid;

  // clubId 가드
  useEffect(() => {
    if (!clubId || clubId === 'select') {
      const go = new URLSearchParams(location.search).get('go') || 'blog';
      nav(`/clubs/select?go=${go}`, { replace: true });
      return;
    }
  }, [clubId, nav, location]);

  useEffect(() => {
    if (!clubId || clubId === 'select') return;
    
    const col = collection(db, `clubs/${clubId}/blog`);
    const q = query(
      col, 
      where('published','==', true),
      orderBy('pinned','desc'),
      orderBy('createdAt','desc')
    );
    return onSnapshot(q, s => setPosts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [clubId]);

  const canEdit = (p: any) => {
    if (!uid) return false;
    // 작성자이거나 클럽 관리자인 경우
    return uid === p.authorUid || p._clubIsAdmin;
  };

  const onDelete = async (id: string) => {
    if (!confirm('이 글을 삭제할까요?')) return;
    await deleteDoc(doc(db, `clubs/${clubId}/blog/${id}`));
  };

  const togglePin = async (p: any) => {
    await updateDoc(doc(db, `clubs/${clubId}/blog/${p.id}`), { pinned: !p.pinned });
  };

  const togglePublished = async (p: any) => {
    await updateDoc(doc(db, `clubs/${clubId}/blog/${p.id}`), { published: !p.published });
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">블로그</h1>
        <div className="flex gap-2">
          <button
            onClick={() => nav(`/clubs/${clubId}/blog/pending`)}
            className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50"
          >
            대기열
          </button>
          <button
            onClick={() => nav(`/clubs/${clubId}/blog/new`)}
            className="px-3 py-1.5 border rounded text-sm bg-blue-500 text-white hover:bg-blue-600"
          >
            새 글 쓰기
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {posts.map(p => (
          <div key={p.id} className="border rounded p-3">
            <div className="flex items-center justify-between">
              <Link to={`/clubs/${clubId}/blog/${p.id}`} className="font-semibold hover:underline">
                {p.title}
              </Link>
              <div className="space-x-2">
                {canEdit(p) && (
                  <>
                    <Link to={`/clubs/${clubId}/blog/${p.id}/edit`} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">수정</Link>
                    <button onClick={() => onDelete(p.id)} className="px-2 py-1 text-xs border rounded text-red-600 hover:bg-red-50">삭제</button>
                    <button onClick={() => togglePin(p)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">{p.pinned ? '고정 해제' : '고정'}</button>
                    <button onClick={() => togglePublished(p)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">{p.published ? '비공개로' : '공개로'}</button>
                  </>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{p.content}</p>
            <div className="text-xs text-gray-400 mt-1">
              {p.published ? '공개' : '비공개'} · {(p.createdAt?.toDate?.() || new Date()).toLocaleDateString()}
            </div>
          </div>
        ))}
        {posts.length === 0 && <div className="text-gray-500">아직 게시글이 없어요.</div>}
      </div>
    </div>
  );
}
