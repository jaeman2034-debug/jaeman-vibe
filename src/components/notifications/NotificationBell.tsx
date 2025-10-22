import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { ensureFcmToken } from "@/lib/fcm";
import InboxPanel from "./InboxPanel";

export default function NotificationBell() {
  const [count, setCount] = useState<number>(0);
  const [showInbox, setShowInbox] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);

  // 알림 권한 상태 확인
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) {
      setCount(0);
      return;
    }

    const q = query(
      collection(db, `users/${uid}/inbox`),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCount(snapshot.size);
    });

    return () => unsubscribe();
  }, []);

  // FCM 권한 요청 핸들러
  const handleRequestNotification = async () => {
    try {
      const token = await ensureFcmToken();
      if (token) {
        setNotificationPermission('granted');
        alert('알림이 활성화되었습니다!');
      } else {
        alert('알림 권한이 거부되었습니다.');
      }
    } catch (error) {
      console.error('FCM 권한 요청 실패:', error);
      alert('알림 설정에 실패했습니다.');
    }
  };

  return (
    <div className="relative">
      <button
        className="relative px-3 py-1.5 rounded-xl border hover:bg-zinc-100 dark:hover:bg-zinc-800"
        aria-label="알림"
        onClick={() => setShowInbox(!showInbox)}
      >
        <BellIcon />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-600 text-white text-xs grid place-items-center">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {/* 인박스 드롭다운 */}
      {showInbox && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <InboxPanel />
          
          {/* FCM 권한 요청 섹션 */}
          {notificationPermission !== 'granted' && (
            <div className="p-3 border-t bg-gray-50">
              <p className="text-sm text-gray-600 mb-2">알림을 받으려면 권한을 허용해주세요.</p>
              <button
                onClick={handleRequestNotification}
                className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                알림 켜기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"/>
      <path d="M10 21a2 2 0 0 0 4 0"/>
    </svg>
  );
}