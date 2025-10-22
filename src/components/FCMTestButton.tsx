// ?�� FCM ?�시 ?�림 ?�스??컴포?�트
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
        console.log('??FCM ?�큰 ?�득:', fcmToken);
        
        // ?�립보드??복사
        await navigator.clipboard.writeText(fcmToken);
        alert('FCM ?�큰???�립보드??복사?�었?�니??');
      } else {
        alert('FCM ?�큰??받을 ???�습?�다. ?�림 권한???�인?�주?�요.');
      }
    } catch (error) {
      console.error('??FCM ?�스???�패:', error);
      alert('FCM ?�스?�에 ?�패?�습?�다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <h3 className="font-semibold text-gray-800 mb-3">?�� FCM ?�시 ?�림 ?�스??/h3>
      
      <div className="space-y-3">
        <button
          onClick={handleTestFCM}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'FCM ?�큰 ?�청 �?..' : '?�� FCM ?�큰 ?�스??}
        </button>
        
        {token && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800 font-medium">??FCM ?�큰 ?�득 ?�공!</p>
            <p className="text-xs text-green-600 mt-1 break-all">
              {token.substring(0, 50)}...
            </p>
            <p className="text-xs text-green-600 mt-1">
              (?�립보드??복사??
            </p>
          </div>
        )}
        
        <div className="text-xs text-gray-500">
          <p>???�림 권한???�용?�어???�니??/p>
          <p>??HTTPS ?�경?�서�??�동?�니??/p>
          <p>???�큰??n8n/Functions?�서 ?�용?�세??/p>
        </div>
      </div>
    </div>
  );
}
