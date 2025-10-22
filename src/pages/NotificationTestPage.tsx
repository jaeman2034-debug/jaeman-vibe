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
          await createTestNotifications.newMessage(user.uid, "ê¹€ì² ìˆ˜");
          break;
        case 'comment':
          await createTestNotifications.newComment(user.uid, "ì¶•êµ¬ ëª¨ì„ ê²Œì‹œ??);
          break;
        case 'market':
          await createTestNotifications.marketUpdate(user.uid, "?˜ì´??ì¶•êµ¬??, "?ë§¤?„ë£Œ");
          break;
        case 'system':
          await createTestNotifications.systemMessage(user.uid, "?œë²„ ?ê? ?ˆì •: 2024??1??15??02:00-04:00");
          break;
      }
      alert("???ŒìŠ¤???Œë¦¼???ì„±?˜ì—ˆ?µë‹ˆ??");
    } catch (error) {
      console.error("?Œë¦¼ ?ì„± ?¤íŒ¨:", error);
      alert("???Œë¦¼ ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    try {
      await markAllNotificationsAsRead(user.uid);
      alert("??ëª¨ë“  ?Œë¦¼???½ìŒ ì²˜ë¦¬?ˆìŠµ?ˆë‹¤!");
    } catch (error) {
      console.error("?½ìŒ ì²˜ë¦¬ ?¤íŒ¨:", error);
      alert("???½ìŒ ì²˜ë¦¬???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center">ë¡œë”© ì¤?..</div>;
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-4">ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??/h2>
        <p>?Œë¦¼ ?ŒìŠ¤?¸ë? ?„í•´ ë¨¼ì? ë¡œê·¸?¸í•´ì£¼ì„¸??</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">?”” FCM ?Œë¦¼ ?ŒìŠ¤???˜ì´ì§€</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">?“‹ ?¬ìš©???•ë³´</h3>
        <p><strong>UID:</strong> {user.uid}</p>
        <p><strong>?´ë©”??</strong> {user.email || "?µëª… ?¬ìš©??}</p>
        <p><strong>?œì‹œëª?</strong> {user.displayName || "?†ìŒ"}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* ?ŒìŠ¤???Œë¦¼ ?ì„± */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-xl font-semibold mb-4">?§ª ?ŒìŠ¤???Œë¦¼ ?ì„±</h3>
          <div className="space-y-3">
            <button
              onClick={() => handleCreateNotification('message')}
              disabled={isCreating}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              ?’¬ ??ë©”ì‹œì§€ ?Œë¦¼
            </button>
            <button
              onClick={() => handleCreateNotification('comment')}
              disabled={isCreating}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              ?’­ ???“ê? ?Œë¦¼
            </button>
            <button
              onClick={() => handleCreateNotification('market')}
              disabled={isCreating}
              className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
            >
              ?›’ ?í’ˆ ?…ë°?´íŠ¸ ?Œë¦¼
            </button>
            <button
              onClick={() => handleCreateNotification('system')}
              disabled={isCreating}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
            >
              ?”” ?œìŠ¤???Œë¦¼
            </button>
          </div>
        </div>

        {/* ?Œë¦¼ ê´€ë¦?*/}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-xl font-semibold mb-4">?™ï¸ ?Œë¦¼ ê´€ë¦?/h3>
          <div className="space-y-3">
            <button
              onClick={handleMarkAllAsRead}
              className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              ??ëª¨ë“  ?Œë¦¼ ?½ìŒ ì²˜ë¦¬
            </button>

            <button
              onClick={() => createTestNotifications.createBulkTestData(user.uid, 20)}
              disabled={isCreating}
              className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
            >
              ?? ?€???ŒìŠ¤???°ì´???ì„± (20ê°?
            </button>

            <button
              onClick={() => createTestNotifications.createBulkTestData(user.uid, 50)}
              disabled={isCreating}
              className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
            >
              ?“Š ?€???ŒìŠ¤???°ì´???ì„± (50ê°?
            </button>

            <button
              onClick={async () => {
                setIsCreating(true);
                try {
                  await createBulkTestReports();
                  alert("??AI ë¦¬í¬???ŒìŠ¤???°ì´?°ê? ?ì„±?˜ì—ˆ?µë‹ˆ??");
                } catch (error) {
                  alert("??AI ë¦¬í¬???ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
                } finally {
                  setIsCreating(false);
                }
              }}
              disabled={isCreating}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
            >
              ?¤– AI ë¦¬í¬???ŒìŠ¤???°ì´???ì„± (7??
            </button>
            
            <div className="text-sm text-gray-600">
              <p className="mb-2"><strong>?’¡ ?ŒìŠ¤??ë°©ë²•:</strong></p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>??ë²„íŠ¼?¼ë¡œ ?ŒìŠ¤???Œë¦¼ ?ì„±</li>
                <li>?¤ë”???”” ë°°ì? ?•ì¸</li>
                <li><a href="/notifications" className="text-blue-600 hover:underline">?Œë¦¼ ?€?œë³´??/a>?ì„œ ?œê°???•ì¸</li>
                <li><a href="/admin/reports" className="text-blue-600 hover:underline">AI ë¦¬í¬???€?œë³´??/a>?ì„œ AI ?”ì•½ ?•ì¸</li>
                <li>ë¸Œë¼?°ì? ?Œë¦¼ ê¶Œí•œ ?•ì¸</li>
                <li>ê°œë°œ???„êµ¬ ì½˜ì†” ë¡œê·¸ ?•ì¸</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* FCM ?íƒœ ?•ë³´ */}
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">?”§ FCM ?¤ì • ?íƒœ</h3>
        <div className="text-sm text-yellow-700 space-y-1">
          <p>??Service Worker: firebase-messaging-sw.js</p>
          <p>??FCM ? í°: ë¡œê·¸?????ë™ ?±ë¡</p>
          <p>???Œë¦¼ ê¶Œí•œ: ë¸Œë¼?°ì? ?¤ì •?ì„œ ?•ì¸</p>
          <p>???¤ì‹œê°?ê°ì?: Firestore onSnapshot ?œì„±??/p>
        </div>
      </div>

      {/* ê°œë°œ???„êµ¬ ?ˆë‚´ */}
      <div className="bg-gray-50 p-4 rounded-lg mt-6">
        <h3 className="font-semibold text-gray-800 mb-2">?› ï¸?ê°œë°œ???„êµ¬ ëª…ë ¹??/h3>
        <div className="text-sm text-gray-600 space-y-1 font-mono">
          <p>??<code>window.createTestNotification('userId', '?œëª©', '?´ìš©')</code></p>
          <p>??<code>window.createTestNotifications.newMessage('userId', '?¡ì‹ ??)</code></p>
          <p>??<code>window.requestPermissionAndToken()</code> - FCM ? í° ?¬ìš”ì²?/p>
        </div>
      </div>
    </div>
  );
}
