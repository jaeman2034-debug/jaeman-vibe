import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';

interface InboxItem {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: any;
  read: boolean;
  createdAt: any;
}

export default function InboxPanel() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `users/${uid}/inbox`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InboxItem[];

      setItems(data);
      setUnreadCount(data.filter(item => !item.read).length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (itemId: string) => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) return;

    try {
      await updateDoc(doc(db, `users/${uid}/inbox`, itemId), {
        read: true
      });
    } catch (error) {
      console.error('읽음 처리 실패:', error);
    }
  };

  const markAllAsRead = async () => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) return;

    try {
      const unreadItems = items.filter(item => !item.read);
      const promises = unreadItems.map(item => 
        updateDoc(doc(db, `users/${uid}/inbox`, item.id), { read: true })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('전체 읽음 처리 실패:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment.confirm':
        return '💳';
      case 'announce.create':
        return '📢';
      case 'announce.pin':
        return '📌';
      case 'waitlist.promoted':
        return '🎉';
      case 'penalty.no_show':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'payment.confirm':
        return '결제 완료';
      case 'announce.create':
        return '새 공지';
      case 'announce.pin':
        return '중요 공지';
      case 'waitlist.promoted':
        return '대기열 승격';
      case 'penalty.no_show':
        return '노쇼 페널티';
      default:
        return '알림';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return '방금 전';
      if (diffMins < 60) return `${diffMins}분 전`;
      if (diffHours < 24) return `${diffHours}시간 전`;
      if (diffDays < 7) return `${diffDays}일 전`;
      return date.toLocaleDateString('ko-KR');
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        알림을 불러오는 중...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          알림함 {unreadCount > 0 && (
            <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            모두 읽음
          </button>
        )}
      </div>

      {/* 알림 목록 */}
      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📭</div>
          <p>알림이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                item.read 
                  ? 'bg-gray-50 border-gray-200' 
                  : 'bg-blue-50 border-blue-200'
              }`}
              onClick={() => markAsRead(item.id)}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">
                  {getTypeIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-600">
                      {getTypeLabel(item.type)}
                    </span>
                    {!item.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    {item.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {item.body}
                  </p>
                  <div className="text-xs text-gray-400">
                    {formatDate(item.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
