import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RequireRole } from '../../components/auth/RequireRole';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import ClubBlogButton from '../../admin/ClubBlogButton';
import JoinPayButton from '../../join/JoinPayButton';
import SubscribeButton from '../../subscription/SubscribeButton';
import ManageBillingButton from '../../subscription/ManageBillingButton';
import JoinPaySmartButton from '../../payment/JoinPaySmartButton';
import TossBillingRegister from '../../billing/TossBillingRegister';
import TossBillingCharge from '../../billing/TossBillingCharge';

export default function ClubAdminPage(){
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [club, setClub] = useState<any>();
  const [apps, setApps] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [md, setMd] = useState('');

  // 초대 링크 생성 함수
  async function createInvite(role = 'player') {
    if (!user) return alert('로그인이 필요합니다');
    
    try {
      const idToken = await user.getIdToken();
      const resp = await fetch(`/api/clubs/${id}/invites`, { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${idToken}` 
        }, 
        body: JSON.stringify({ role }) 
      });
      
      const data = await resp.json();
      if (resp.ok) {
        navigator.clipboard.writeText(data.url);
        alert(`${role} 초대 링크를 복사했어요!`);
      } else {
        alert('초대 링크 생성 실패: ' + data.error);
      }
    } catch (e) {
      alert('오류가 발생했습니다: ' + e.message);
    }
  }

  // 팀 블로그 생성 함수
  async function createTeamBlog() {
    if (!user) return alert('로그인이 필요합니다');
    
    try {
      const blogData = {
        clubId: id,
        clubName: club?.name || 'YAGO FC',
        sport: club?.sport || 'soccer',
        branch: 'academy',
        leafs: ['U10'],
        title: prompt('블로그 제목을 입력하세요:', `${club?.name || 'YAGO'} 새로운 모임`),
        subtitle: prompt('부제목을 입력하세요:', '즐겁고 안전한 참여를 위해 기본 수칙을 확인해주세요.'),
        eventStart: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7일 후
        eventEnd: Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000, // 2시간 후
        venue: prompt('장소를 입력하세요:', '송산2동 체육공원'),
        city: prompt('도시를 입력하세요:', '의정부'),
        price: parseInt(prompt('참가비를 입력하세요 (원):', '15000')) || 0,
        tags: ['초보', '유소년'],
        ctaUrl: `${window.location.origin}/meetups/new`
      };

      if (!blogData.title) return;

      const resp = await fetch('/webhook/team-blog-create', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(blogData) 
      });
      
      const data = await resp.json();
      if (resp.ok) {
        alert('팀 블로그가 생성되었습니다! Notion에서 확인해보세요.');
      } else {
        alert('블로그 생성 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (e) {
      alert('오류가 발생했습니다: ' + e.message);
    }
  }

  useEffect(()=>{ 
    (async()=>{
      const c = await getDoc(doc(db,'clubs', id!)); 
      setClub({ id: c.id, ...c.data() });
      
      const a = await getDocs(collection(db,'clubs', id!, 'applications')); 
      setApps(a.docs.map(d=>({id:d.id, ...d.data()})));
      
      const m = await getDocs(collection(db,'clubs', id!, 'members')); 
      setMembers(m.docs.map(d=>({id:d.id, ...d.data()})));
    })(); 
  },[id, db]);

  const approve = async (uid:string)=>{
    await setDoc(doc(db,'clubs', id!, 'members', uid), { 
      role:'member', 
      status:'approved', 
      joinedAt: serverTimestamp() 
    }, { merge: true });
    
    await updateDoc(doc(db,'clubs', id!, 'applications', uid), { 
      status:'approved' 
    });
    
    try{ 
      const hook=(import.meta as any).env.VITE_N8N_WEBHOOK_CLUB_APPROVE; 
      hook && await fetch(hook,{
        method:'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({ clubId:id, uid })
      }); 
    }catch{}
    
    // 페이지 새로고침
    window.location.reload();
  };

  const reject = async (uid:string)=>{
    await updateDoc(doc(db,'clubs', id!, 'applications', uid), { 
      status:'rejected' 
    });
    
    // 페이지 새로고침
    window.location.reload();
  };

  const publish = async (blogType: 'github' | 'notion' | 'sites' | 'drive' = 'github') => {
    const { currentUser } = getAuth(); 
    if (!currentUser) return alert('로그인 필요');
    
    const ref = await addDoc(collection(db,'clubs', id!, 'posts'), { 
      title, 
      contentMd: md, 
      authorUid: currentUser.uid, 
      status:'published', 
      publishedAt: serverTimestamp(),
      blogType
    });
    
    // 블로그 타입별 동기화
    try{ 
      let hook;
      switch(blogType) {
        case 'notion':
          hook = (import.meta as any).env.VITE_N8N_WEBHOOK_CLUB_POST_NOTION;
          break;
        case 'sites':
          hook = (import.meta as any).env.VITE_N8N_WEBHOOK_CLUB_POST_SITES;
          break;
        case 'drive':
          hook = (import.meta as any).env.VITE_N8N_WEBHOOK_CLUB_POST_DRIVE;
          break;
        default:
          hook = (import.meta as any).env.VITE_N8N_WEBHOOK_CLUB_POST;
      }
      
      hook && await fetch(hook,{ 
        method:'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({ clubId:id, postId: ref.id, title, contentMd: md }) 
      }); 
    }catch{}
    
    setTitle(''); 
    setMd('');
    alert(`글이 ${blogType.toUpperCase()}에 발행되었습니다!`);
  };

  if (!club) return <div className="p-4">로딩 중...</div>;
  
  return (
    <RequireRole clubId={id!} roles={['owner', 'manager', 'coach']}>
      <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{club.name} – 관리</h1>
        <button className="btn" onClick={() => navigate(`/clubs/${id}`)}>클럽 보기</button>
      </div>

      <section className="rounded-xl border p-3 bg-white">
        <h3 className="font-semibold mb-2">가입 신청({apps.length})</h3>
        {apps.length? apps.map(a=> (
          <div key={a.id} className="flex justify-between py-2 border-b last:border-none">
            <div className="flex-1">
              <div className="font-medium">{a.id}</div>
              <div className="text-sm text-gray-600">{a.message||'메시지 없음'}</div>
              <div className="text-xs text-gray-500">상태: {a.status}</div>
            </div>
            {a.status==='applied' && (
              <div className="flex gap-2">
                <button className="btn-primary" onClick={()=>approve(a.id)}>승인</button>
                <button className="btn" onClick={()=>reject(a.id)}>거절</button>
              </div>
            )}
          </div>
        )): <div className="text-sm text-gray-500">대기 중인 신청 없음</div>}
      </section>

      {/* Notion 블로그 생성 */}
      <ClubBlogButton clubId={id!} />

      {/* Join 결제 버튼 */}
      <JoinPayButton 
        clubId={id!} 
        amount={club.fee || 30000} 
        orderName={`${club.name} 회원가입`}
        onSuccess={(orderId) => console.log('결제 성공:', orderId)}
        onError={(error) => console.error('결제 실패:', error)}
      />

      {/* Stripe 구독 버튼 */}
      <SubscribeButton 
        clubId={id!}
        onSuccess={(url) => console.log('구독 시작:', url)}
        onError={(error) => console.error('구독 실패:', error)}
      />

      {/* 구독 관리 버튼 */}
      <ManageBillingButton 
        clubId={id!}
        onSuccess={(url) => console.log('포털 열기:', url)}
        onError={(error) => console.error('포털 실패:', error)}
      />

      {/* 스마트 결제 버튼 */}
      <JoinPaySmartButton 
        clubId={id!}
        amount={club.fee || 30000}
        orderName={`${club.name} 회원가입`}
        currency="KRW"
        gateway="auto"
        onSuccess={(result) => console.log('스마트 결제 시작:', result)}
        onError={(error) => console.error('스마트 결제 실패:', error)}
      />

      {/* Toss 빌링키 등록 */}
      <TossBillingRegister 
        clubId={id!}
        onSuccess={(result) => console.log('빌링키 등록 성공:', result)}
        onError={(error) => console.error('빌링키 등록 실패:', error)}
      />

      {/* Toss 정기결제 실행 */}
      <TossBillingCharge 
        clubId={id!}
        amount={club.fee || 30000}
        orderName={`${club.name} 정기결제`}
        onSuccess={(result) => console.log('정기결제 실행 성공:', result)}
        onError={(error) => console.error('정기결제 실행 실패:', error)}
      />

      <section className="rounded-xl border p-3 bg-white">
        <h3 className="font-semibold mb-2">블로그 글 발행</h3>
        <input 
          className="input w-full mb-2" 
          placeholder="제목" 
          value={title} 
          onChange={e=>setTitle(e.target.value)} 
        />
        <textarea 
          className="input w-full h-40" 
          placeholder="내용(Markdown)" 
          value={md} 
          onChange={e=>setMd(e.target.value)} 
        />
        <div className="mt-2 flex gap-2 flex-wrap">
          <button className="btn-primary" onClick={() => publish('github')} disabled={!title.trim() || !md.trim()}>
            GitHub 발행
          </button>
          <button className="btn" onClick={() => publish('notion')} disabled={!title.trim() || !md.trim()}>
            Notion 발행
          </button>
          <button className="btn" onClick={() => publish('sites')} disabled={!title.trim() || !md.trim()}>
            Sites 발행
          </button>
          <button className="btn" onClick={() => publish('drive')} disabled={!title.trim() || !md.trim()}>
            Drive 발행
          </button>
          <button 
            className="btn bg-blue-600 text-white hover:bg-blue-700" 
            onClick={createTeamBlog}
          >
            🚀 팀 블로그 생성
          </button>
        </div>
      </section>

      <section className="rounded-xl border p-3 bg-white">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">멤버({members.length})</h3>
          <div className="flex gap-2">
            <button 
              className="btn-sm" 
              onClick={() => createInvite('player')}
            >
              플레이어 초대
            </button>
            <button 
              className="btn-sm" 
              onClick={() => createInvite('manager')}
            >
              매니저 초대
            </button>
          </div>
        </div>
        <ul className="grid md:grid-cols-2 gap-2">
          {members.map(m=> (
            <li key={m.id} className="rounded border p-2">
              <div className="font-medium">{m.id}</div>
              <div className="text-sm text-gray-600">{m.role} – {m.status}</div>
              <div className="text-xs text-gray-500">
                {m.joinedAt?.toDate?.()?.toLocaleDateString() || '날짜 없음'}
              </div>
            </li>
          ))}
        </ul>
      </section>
      </div>
    </RequireRole>
  );
}
