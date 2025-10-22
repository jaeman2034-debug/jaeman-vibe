import React, { useEffect, useState } from 'react';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/lib/firebase';

export default function CommentList({ eventId, postId }: { eventId: string; postId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'events', eventId, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, s => setRows(s.docs.map(d => ({ id: d.id, ...(d.data() as any) }))));
    return () => unsub();
  }, [eventId, postId]);

  const add = async () => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) return alert('로그인 필요');
    if (!text.trim()) return;
    
    await addDoc(collection(db, 'events', eventId, 'posts', postId, 'comments'), {
      text,
      authorId: uid,
      createdAt: serverTimestamp()
    });
    setText('');
  };

  return (
    <div className="mt-3">
      <ul className="space-y-2">
        {rows.map(c => (
          <li key={c.id} className="text-sm">
            <span className="text-gray-400">• </span>
            {c.text}
          </li>
        ))}
      </ul>
      <div className="flex gap-2 mt-2">
        <input 
          className="flex-1 border rounded-lg p-2" 
          placeholder="댓글 입력" 
          value={text} 
          onChange={e => setText(e.target.value)}
        />
        <button className="px-3 py-2 rounded-xl border" onClick={add}>
          등록
        </button>
      </div>
    </div>
  );
}
