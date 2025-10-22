import { Link } from "react-router-dom";

export default function NotifyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            ?îî ?åÎ¶º?ºÌÑ∞
          </h1>
          <p className="text-gray-600">
            Î©Ä?∞Ï±Ñ???åÎ¶º ?úÏä§??          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* n8n Î©Ä?∞Ï±Ñ??*/}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">?îó</div>
              <h3 className="text-lg font-bold text-gray-800">n8n Î©Ä?∞Ï±Ñ??/h3>
              <span className="text-green-600 text-sm font-medium">??Íµ¨ÌòÑ??/span>
            </div>
            <p className="text-gray-600 text-sm text-center">
              KakaoTalk, SMS, Email, Slack
            </p>
          </div>
          
          {/* FCM ?∏Ïãú */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">?ì±</div>
              <h3 className="text-lg font-bold text-gray-800">FCM ?∏Ïãú</h3>
              <span className="text-red-600 text-sm font-medium">??ÎØ∏Íµ¨??/span>
            </div>
            <p className="text-gray-600 text-sm text-center">
              Firebase Cloud Messaging
            </p>
          </div>
          
          {/* Ïπ¥ÌÖåÍ≥†Î¶¨ */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">?è∑Ô∏?/div>
              <h3 className="text-lg font-bold text-gray-800">Ïπ¥ÌÖåÍ≥†Î¶¨</h3>
              <span className="text-red-600 text-sm font-medium">??ÎØ∏Íµ¨??/span>
            </div>
            <p className="text-gray-600 text-sm text-center">
              ?åÎ¶º Î∂ÑÎ•ò Î∞??ÑÌÑ∞Îß?            </p>
          </div>
          
          {/* ?§ÏãúÍ∞??åÎ¶º */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">??/div>
              <h3 className="text-lg font-bold text-gray-800">?§ÏãúÍ∞??åÎ¶º</h3>
              <span className="text-red-600 text-sm font-medium">??ÎØ∏Íµ¨??/span>
            </div>
            <p className="text-gray-600 text-sm text-center">
              WebSocket Í∏∞Î∞ò ?§ÏãúÍ∞??åÎ¶º
            </p>
          </div>
          
          {/* ?åÎ¶º ?àÏä§?†Î¶¨ */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">?ìã</div>
              <h3 className="text-lg font-bold text-gray-800">?åÎ¶º ?àÏä§?†Î¶¨</h3>
              <span className="text-red-600 text-sm font-medium">??ÎØ∏Íµ¨??/span>
            </div>
            <p className="text-gray-600 text-sm text-center">
              Î∞úÏÜ° ?¥Î†• Î∞??ÅÌÉú Í¥ÄÎ¶?            </p>
          </div>
          
          {/* ?åÎ¶º ?§Ï†ï */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">?ôÔ∏è</div>
              <h3 className="text-lg font-bold text-gray-800">?åÎ¶º ?§Ï†ï</h3>
              <span className="text-red-600 text-sm font-medium">??ÎØ∏Íµ¨??/span>
            </div>
            <p className="text-gray-600 text-sm text-center">
              ?¨Ïö©?êÎ≥Ñ ?åÎ¶º ?§Ï†ï
            </p>
          </div>
        </div>
        
        <div className="text-center mt-8">
          <Link
            to="/dashboard"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            ???Ä?úÎ≥¥?úÎ°ú ?åÏïÑÍ∞ÄÍ∏?          </Link>
        </div>
      </div>
    </div>
  );
}
