import { useParams, Link, useNavigate } from "react-router-dom";
import { getFirestore, collection, query, limit, getDocs, doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";

export default function ClubBlogPost() {
  const { clubId, postId } = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const { currentUser } = getAuth();

  useEffect(() => {
    (async () => {
      if (!clubId || !postId) return;
      
      const db = getFirestore();
      try {
        // 특정 포스트 가져오기
        const postDoc = await getDoc(doc(db, "clubs", clubId, "blog", postId));
        if (postDoc.exists()) {
          setPost({ id: postDoc.id, ...postDoc.data() });
        } else {
          setPost(null);
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        setPost(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [clubId, postId]);

  // 공유 기능
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // 폴백: URL 복사
      navigator.clipboard.writeText(window.location.href);
      alert('링크가 복사되었습니다!');
    }
  };

  if (loading) return <div className="p-4 text-sm text-gray-500">불러오는 중…</div>;
  if (!post) return <div className="p-4 text-sm text-gray-500">글을 찾을 수 없습니다.</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <Link to={`/clubs/${clubId}/blog`} className="text-sm text-blue-600 hover:text-blue-800">
          ← 목록으로 돌아가기
        </Link>
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
          >
            공유
          </button>
          {currentUser && currentUser.uid === post.authorUid && (
            <button
              onClick={() => nav(`/clubs/${clubId}/blog/${postId}/edit`)}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
            >
              수정
            </button>
          )}
        </div>
      </div>
      
      <article className="prose max-w-none">
        <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
        <div className="text-sm text-gray-500 mb-6">
          {post.createdAt?.toDate?.()?.toLocaleDateString() || '날짜 없음'}
        </div>
        <div className="whitespace-pre-wrap text-[15px] leading-6">
          {post.content || post.body}
        </div>
      </article>
    </div>
  );
}
