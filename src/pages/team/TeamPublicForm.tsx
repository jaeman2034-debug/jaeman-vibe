import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';

export default function TeamPublicForm() {
  const { teamId } = useParams();
  const [form, setForm] = useState<any>({
    tagline: '', description: '',
    schedule: { summary: '', placeName: '' },
    contact: {}, dues: {},
    logoUrl: '', coverUrl: '',
    gallery: [], achievements: [],
  });
  const [blogUrl, setBlogUrl] = useState<string>('');

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, 'teams', teamId!));
      if (snap.exists()) {
        const t: any = snap.data();
        setForm({ ...form, ...(t.public || {}) });
        setBlogUrl(t.public?.blog?.url || '');
      }
    })();
    // eslint-disable-next-line
  }, [teamId]);

  const save = async () => {
    await setDoc(doc(db, 'teams', teamId!), { public: { ...form } }, { merge: true });
    alert('저장 완료');
  };

  const sync = async () => {
    const call = httpsCallable(functions, 'syncTeamBlog');
    const res: any = await call({ teamId });
    if (res?.data?.blogUrl) setBlogUrl(res.data.blogUrl);
    alert('블로그 갱신 완료');
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">팀 공개 정보</h1>
      <div className="space-y-2">
        <label className="block text-sm">한 줄 소개</label>
        <input className="input input-bordered w-full" value={form.tagline}
          onChange={e=>setForm((p:any)=>({...p, tagline:e.target.value}))}/>
      </div>
      <div className="space-y-2">
        <label className="block text-sm">팀 소개</label>
        <textarea className="textarea textarea-bordered w-full" rows={6} value={form.description}
          onChange={e=>setForm((p:any)=>({...p, description:e.target.value}))}/>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm">정기 일정 요약</label>
          <input className="input input-bordered w-full" value={form.schedule?.summary||''}
            onChange={e=>setForm((p:any)=>({...p, schedule:{...p.schedule, summary:e.target.value}}))}/>
        </div>
        <div>
          <label className="block text-sm">장소</label>
          <input className="input input-bordered w-full" value={form.schedule?.placeName||''}
            onChange={e=>setForm((p:any)=>({...p, schedule:{...p.schedule, placeName:e.target.value}}))}/>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm">로고 URL</label>
          <input className="input input-bordered w-full" value={form.logoUrl||''}
            onChange={e=>setForm((p:any)=>({...p, logoUrl:e.target.value}))}/>
        </div>
        <div>
          <label className="block text-sm">커버 URL</label>
          <input className="input input-bordered w-full" value={form.coverUrl||''}
            onChange={e=>setForm((p:any)=>({...p, coverUrl:e.target.value}))}/>
        </div>
        <div>
          <label className="block text-sm">연락처(카카오 오픈채팅)</label>
          <input className="input input-bordered w-full" value={form.contact?.kakaoOpenChat||''}
            onChange={e=>setForm((p:any)=>({...p, contact:{...p.contact, kakaoOpenChat:e.target.value}}))}/>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="btn" onClick={save}>저장</button>
        <button className="btn" onClick={sync}>블로그 {blogUrl? '갱신':'만들기'}</button>
        {blogUrl && <a className="btn" href={blogUrl} target="_blank" rel="noreferrer">블로그 열기</a>}
      </div>
    </div>
  );
}
