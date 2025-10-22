import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/lib/firebase';

export default function PostComposer({ eventId, type, onClose }: {
  eventId: string;
  type: 'checkin' | 'mate' | 'carpool';
  onClose: () => void;
}) {
  const [text, setText] = useState(
    type === 'mate' ? '스파링 구해요 (포지션/시간 댓글)' :
    type === 'carpool' ? '카풀 같이 가요 (출발지/좌석수 알려주세요)' :
    '출석 체크합니다!'
  );
  const [from, setFrom] = useState('');
  const [seats, setSeats] = useState(2);

  const submit = async () => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) return alert('로그인 필요');
    
    const payload: any = { type, text, authorId: uid, createdAt: serverTimestamp() };
    if (type === 'carpool') payload.carpool = { from, seats };
    
    await addDoc(collection(db, 'events', eventId, 'posts'), payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center" onClick={onClose}>
      <div className="bg-white rounded-2xl p-4 w-[90vw] max-w-md" onClick={e => e.stopPropagation()}>
        <div className="font-semibold mb-2">새 글</div>
        <textarea 
          className="w-full h-28 border rounded-lg p-2" 
          value={text} 
          onChange={e => setText(e.target.value)}
        />
        {type === 'carpool' && (
          <div className="flex gap-2 mt-2">
            <input 
              className="flex-1 border rounded-lg p-2" 
              placeholder="출발지" 
              value={from} 
              onChange={e => setFrom(e.target.value)}
            />
            <input 
              className="w-24 border rounded-lg p-2" 
              type="number" 
              min={1} 
              max={6} 
              value={seats} 
              onChange={e => setSeats(Number(e.target.value))}
            />
          </div>
        )}
        <div className="flex justify-end gap-2 mt-3">
          <button className="px-3 py-2 rounded-xl border" onClick={onClose}>
            취소
          </button>
          <button className="px-3 py-2 rounded-xl bg-black text-white" onClick={submit}>
            등록
          </button>
        </div>
      </div>
    </div>
  );
}
