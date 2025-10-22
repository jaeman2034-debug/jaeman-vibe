import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function TeamPublicContribForm(){
  const { teamId } = useParams();
  const [patch, setPatch] = useState<any>({ tagline:'', description:'', galleryAppend:[] as string[] });

  const submit = async () => {
    await addDoc(collection(db, 'teams', teamId!, 'publicContribs'), {
      patch,
      status: 'requested',
      createdAt: serverTimestamp()
    });
    alert('제출 완료 (관리자 승인 대기)');
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-lg font-semibold">팀 공개 정보 제안</h1>
      <input className="input input-bordered w-full" placeholder="한 줄 소개(선택)"
        value={patch.tagline}
        onChange={e=>setPatch((p:any)=>({...p, tagline:e.target.value}))}/>
      <textarea className="textarea textarea-bordered w-full" rows={5} placeholder="팀 소개(선택)"
        value={patch.description}
        onChange={e=>setPatch((p:any)=>({...p, description:e.target.value}))}/>
      <input className="input input-bordered w-full" placeholder="갤러리 이미지 URL(콤마로)"
        onChange={e=>setPatch((p:any)=>({...p, galleryAppend:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}))}/>
      <button className="btn" onClick={submit}>제출</button>
    </div>
  );
}
