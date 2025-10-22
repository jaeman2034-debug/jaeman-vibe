import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { createTestNotifications, markAllNotificationsAsRead } from "../lib/notifications";
import { createBulkTestReports } from "../lib/testReports";

export default function NotificationTestPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNotification = async (type: string) => {
    if (!user) return;
    
    setIsCreating(true);
    try {
      switch (type) {
        case 'message':
          await createTestNotifications.newMessage(user.uid, "김철수");
          break;
        case 'comment':
          await createTestNotifications.newComment(user.uid, "축구 모임 게시??);
          break;
        case 'market':
          await createTestNotifications.marketUpdate(user.uid, "?�이??축구??, "?�매?�료");
          break;
        case 'system':
          await createTestNotifications.systemMessage(user.uid, "?�버 ?��? ?�정: 2024??1??15??02:00-04:00");
          break;
      }
      alert("???�스???�림???�성?�었?�니??");
    } catch (error) {
      console.error("?�림 ?�성 ?�패:", error);
      alert("???�림 ?�성???�패?�습?�다.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    try {
      await markAllNotificationsAsRead(user.uid);
      alert("??모든 ?�림???�음 처리?�습?�다!");
    } catch (error) {
      console.error("?�음 처리 ?�패:", error);
      alert("???�음 처리???�패?�습?�다.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center">로딩 �?..</div>;
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-4">로그?�이 ?�요?�니??/h2>
        <p>?�림 ?�스?��? ?�해 먼�? 로그?�해주세??</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">?�� FCM ?�림 ?�스???�이지</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">?�� ?�용???�보</h3>
        <p><strong>UID:</strong> {user.uid}</p>
        <p><strong>?�메??</strong> {user.email || "?�명 ?�용??}</p>
        <p><strong>?�시�?</strong> {user.displayName || "?�음"}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* ?�스???�림 ?�성 */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-xl font-semibold mb-4">?�� ?�스???�림 ?�성</h3>
          <div className="space-y-3">
            <button
              onClick={() => handleCreateNotification('message')}
              disabled={isCreating}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              ?�� ??메시지 ?�림
            </button>
            <button
              onClick={() => handleCreateNotification('comment')}
              disabled={isCreating}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              ?�� ???��? ?�림
            </button>
            <button
              onClick={() => handleCreateNotification('market')}
              disabled={isCreating}
              className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
            >
              ?�� ?�품 ?�데?�트 ?�림
            </button>
            <button
              onClick={() => handleCreateNotification('system')}
              disabled={isCreating}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
            >
              ?�� ?�스???�림
            </button>
          </div>
        </div>

        {/* ?�림 관�?*/}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-xl font-semibold mb-4">?�️ ?�림 관�?/h3>
          <div className="space-y-3">
            <button
              onClick={handleMarkAllAsRead}
              className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              ??모든 ?�림 ?�음 처리
            </button>

            <button
              onClick={() => createTestNotifications.createBulkTestData(user.uid, 20)}
              disabled={isCreating}
              className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
            >
              ?? ?�???�스???�이???�성 (20�?
            </button>

            <button
              onClick={() => createTestNotifications.createBulkTestData(user.uid, 50)}
              disabled={isCreating}
              className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
            >
              ?�� ?�???�스???�이???�성 (50�?
            </button>

            <button
              onClick={async () => {
                setIsCreating(true);
                try {
                  await createBulkTestReports();
                  alert("??AI 리포???�스???�이?��? ?�성?�었?�니??");
                } catch (error) {
                  alert("??AI 리포???�성???�패?�습?�다.");
                } finally {
                  setIsCreating(false);
                }
              }}
              disabled={isCreating}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
            >
              ?�� AI 리포???�스???�이???�성 (7??
            </button>
            
            <div className="text-sm text-gray-600">
              <p className="mb-2"><strong>?�� ?�스??방법:</strong></p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>??버튼?�로 ?�스???�림 ?�성</li>
                <li>?�더???�� 배�? ?�인</li>
                <li><a href="/notifications" className="text-blue-600 hover:underline">?�림 ?�?�보??/a>?�서 ?�각???�인</li>
                <li><a href="/admin/reports" className="text-blue-600 hover:underline">AI 리포???�?�보??/a>?�서 AI ?�약 ?�인</li>
                <li>브라?��? ?�림 권한 ?�인</li>
                <li>개발???�구 콘솔 로그 ?�인</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* FCM ?�태 ?�보 */}
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">?�� FCM ?�정 ?�태</h3>
        <div className="text-sm text-yellow-700 space-y-1">
          <p>??Service Worker: firebase-messaging-sw.js</p>
          <p>??FCM ?�큰: 로그?????�동 ?�록</p>
          <p>???�림 권한: 브라?��? ?�정?�서 ?�인</p>
          <p>???�시�?감�?: Firestore onSnapshot ?�성??/p>
        </div>
      </div>

      {/* 개발???�구 ?�내 */}
      <div className="bg-gray-50 p-4 rounded-lg mt-6">
        <h3 className="font-semibold text-gray-800 mb-2">?���?개발???�구 명령??/h3>
        <div className="text-sm text-gray-600 space-y-1 font-mono">
          <p>??<code>window.createTestNotification('userId', '?�목', '?�용')</code></p>
          <p>??<code>window.createTestNotifications.newMessage('userId', '?�신??)</code></p>
          <p>??<code>window.requestPermissionAndToken()</code> - FCM ?�큰 ?�요�?/p>
        </div>
      </div>
    </div>
  );
}
