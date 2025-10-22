import React from 'react';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/lib/firebase';
import CommentList from './CommentList';

const label: Record<string, string> = {
  checkin: '출첵',
  mate: '스파링',
  carpool: '카풀'
};

export default function PostCard({ eventId, post }: { eventId: string; post: any }) {
  const uid = getAuth().currentUser?.uid;
  const isMine = uid && uid === post.authorId;

  const toggleThanks = async () => {
    if (!uid) return alert('로그인 필요');
    const ref = doc(db, 'events', eventId, 'posts', post.id, 'reactions', uid);
    await setDoc(ref, { type: 'thanks' }, { merge: true }); // 토글은 후행
  };

  return (
    <li className="rounded-xl border p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs px-2 py-1 rounded-lg bg-gray-100">
          {label[post.type] || '글'}
        </div>
        <div className="text-xs text-gray-500">
          {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : ''}
        </div>
      </div>
      <div className="mt-2 whitespace-pre-wrap">{post.text}</div>
      {post.type === 'carpool' && post.carpool && (
        <div className="mt-2 text-sm text-gray-600">
          출발지 {post.carpool.from} · 좌석 {post.carpool.seats}
        </div>
      )}
      <div className="flex items-center gap-3 mt-3">
        <button onClick={toggleThanks} className="text-sm">
          👍 감사
        </button>
        {isMine && (
          <button 
            className="text-sm text-red-600"
            onClick={async () => await deleteDoc(doc(db, 'events', eventId, 'posts', post.id))}
          >
            삭제
          </button>
        )}
      </div>
      <CommentList eventId={eventId} postId={post.id} />
    </li>
  );
}
