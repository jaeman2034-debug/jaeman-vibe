// ?”¥ FCM ?¸ì‹œ ?Œë¦¼ ?ŒìŠ¤??ì»´í¬?ŒíŠ¸
import { useState } from 'react';
import { requestFCMToken } from '@/lib/firebase-messaging';

export default function FCMTestButton() {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const handleTestFCM = async () => {
    setLoading(true);
    try {
      const fcmToken = await requestFCMToken();
      if (fcmToken) {
        setToken(fcmToken);
        console.log('??FCM ? í° ?ë“:', fcmToken);
        
        // ?´ë¦½ë³´ë“œ??ë³µì‚¬
        await navigator.clipboard.writeText(fcmToken);
        alert('FCM ? í°???´ë¦½ë³´ë“œ??ë³µì‚¬?˜ì—ˆ?µë‹ˆ??');
      } else {
        alert('FCM ? í°??ë°›ì„ ???†ìŠµ?ˆë‹¤. ?Œë¦¼ ê¶Œí•œ???•ì¸?´ì£¼?¸ìš”.');
      }
    } catch (error) {
      console.error('??FCM ?ŒìŠ¤???¤íŒ¨:', error);
      alert('FCM ?ŒìŠ¤?¸ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <h3 className="font-semibold text-gray-800 mb-3">?”” FCM ?¸ì‹œ ?Œë¦¼ ?ŒìŠ¤??/h3>
      
      <div className="space-y-3">
        <button
          onClick={handleTestFCM}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'FCM ? í° ?”ì²­ ì¤?..' : '?”” FCM ? í° ?ŒìŠ¤??}
        </button>
        
        {token && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800 font-medium">??FCM ? í° ?ë“ ?±ê³µ!</p>
            <p className="text-xs text-green-600 mt-1 break-all">
              {token.substring(0, 50)}...
            </p>
            <p className="text-xs text-green-600 mt-1">
              (?´ë¦½ë³´ë“œ??ë³µì‚¬??
            </p>
          </div>
        )}
        
        <div className="text-xs text-gray-500">
          <p>???Œë¦¼ ê¶Œí•œ???ˆìš©?˜ì–´???©ë‹ˆ??/p>
          <p>??HTTPS ?˜ê²½?ì„œë§??‘ë™?©ë‹ˆ??/p>
          <p>??? í°??n8n/Functions?ì„œ ?¬ìš©?˜ì„¸??/p>
        </div>
      </div>
    </div>
  );
}
