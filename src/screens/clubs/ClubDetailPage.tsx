import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAuth } from 'firebase/auth';

export default function ClubDetailPage(){
  const { id } = useParams();
  const auth = getAuth();
  const db = getFirestore();
  const [club, setClub] = useState<any>();
  const [posts, setPosts] = useState<any[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  
  useEffect(()=>{ 
    (async()=>{
      const c = await getDoc(doc(db,'clubs', id!)); 
      setClub({ id: c.id, ...c.data() });
      
      const ps = await getDocs(collection(db,'clubs', id!, 'posts')); 
      setPosts(ps.docs.map(d=>({id:d.id, ...d.data()})));
      
      // 소유자 확인
      const currentUser = auth.currentUser;
      if (currentUser && c.data()?.ownerUid === currentUser.uid) {
        setIsOwner(true);
      }
    })(); 
  },[id, db, auth]);
  
  if (!club) return <div className="p-4">로딩 중...</div>;
  
  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{club.name}</h1>
        {isOwner && (
          <Link className="btn" to={`/clubs/${club.id}/admin`}>관리</Link>
        )}
      </div>
      
      <div className="grid md:grid-cols-3 gap-3">
        <div className="md:col-span-2 space-y-3">
          <h2 className="text-lg font-semibold">블로그</h2>
          {posts.length? posts.map(p=> (
            <article key={p.id} className="rounded-xl border p-3 bg-white">
              <h3 className="font-semibold">{p.title}</h3>
              <div className="text-sm text-gray-500 mb-2">
                {p.publishedAt?.toDate?.()?.toLocaleDateString() || '날짜 없음'}
              </div>
              <pre className="whitespace-pre-wrap text-sm">{p.contentMd}</pre>
            </article>
          )) : <div className="text-gray-500">아직 게시글이 없습니다.</div>}
        </div>
        
        <aside className="space-y-2">
          <div className="rounded-xl border p-3 bg-white">
            <h3 className="font-semibold mb-2">클럽 정보</h3>
            {club.description && (
              <p className="text-sm text-gray-600 mb-2">{club.description}</p>
            )}
            <div className="space-y-1 text-sm">
              {club.links?.site && (
                <div><a href={club.links.site} target="_blank" rel="noopener noreferrer" className="text-blue-600">웹사이트</a></div>
              )}
              {club.links?.instagram && (
                <div><a href={club.links.instagram} target="_blank" rel="noopener noreferrer" className="text-blue-600">인스타그램</a></div>
              )}
            </div>
          </div>
          
          <div className="rounded-xl border p-3 bg-white">
            <h3 className="font-semibold mb-2">가입 신청</h3>
            <button className="btn w-full" onClick={() => {
              const currentUser = auth.currentUser;
              if (!currentUser) return alert('로그인 필요');
              // TODO: 가입 신청 로직
              alert('가입 신청 기능은 곧 추가됩니다!');
            }}>
              가입 신청
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
