import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useParams, Link } from 'react-router-dom';
import { db } from '@/lib/firebase';

export default function ClubBlogDetail() {
  const { clubId, postId } = useParams();
  const [post, setPost] = useState<any>(null);

  useEffect(() => {
    if (!clubId || !postId) return;
    
    (async () => {
      const s = await getDoc(doc(db, `clubs/${clubId}/blog/${postId}`));
      setPost({ id: s.id, ...s.data() });
    })();
  }, [clubId, postId]);

  if (!post) return <div className="p-4 text-sm text-gray-500">불러오는 중...</div>;
  
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <article className="prose max-w-none">
        <div className="flex items-center gap-2 mb-2">
          {post.pinned && <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">고정</span>}
          <span className={`px-2 py-1 text-xs rounded ${post.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {post.published ? '공개' : '비공개'}
          </span>
        </div>
        <h1>{post.title}</h1>
        <p className="text-sm text-gray-500">{(post.createdAt?.toDate?.() || new Date()).toLocaleString()}</p>
        <pre className="whitespace-pre-wrap">{post.content}</pre>
        <Link to={`/clubs/${clubId}/blog`} className="px-3 py-1 text-sm border rounded hover:bg-gray-50 mt-4 inline-block">목록</Link>
      </article>
    </div>
  );
}
