import { Link } from "react-router-dom";

export default function NotifyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            ?�� ?�림?�터
          </h1>
          <p className="text-gray-600">
            멀?�채???�림 ?�스??          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* n8n 멀?�채??*/}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">?��</div>
              <h3 className="text-lg font-bold text-gray-800">n8n 멀?�채??/h3>
              <span className="text-green-600 text-sm font-medium">??구현??/span>
            </div>
            <p className="text-gray-600 text-sm text-center">
              KakaoTalk, SMS, Email, Slack
            </p>
          </div>
          
          {/* FCM ?�시 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">?��</div>
              <h3 className="text-lg font-bold text-gray-800">FCM ?�시</h3>
              <span className="text-red-600 text-sm font-medium">??미구??/span>
            </div>
            <p className="text-gray-600 text-sm text-center">
              Firebase Cloud Messaging
            </p>
          </div>
          
          {/* 카테고리 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">?���?/div>
              <h3 className="text-lg font-bold text-gray-800">카테고리</h3>
              <span className="text-red-600 text-sm font-medium">??미구??/span>
            </div>
            <p className="text-gray-600 text-sm text-center">
              ?�림 분류 �??�터�?            </p>
          </div>
          
          {/* ?�시�??�림 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">??/div>
              <h3 className="text-lg font-bold text-gray-800">?�시�??�림</h3>
              <span className="text-red-600 text-sm font-medium">??미구??/span>
            </div>
            <p className="text-gray-600 text-sm text-center">
              WebSocket 기반 ?�시�??�림
            </p>
          </div>
          
          {/* ?�림 ?�스?�리 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">?��</div>
              <h3 className="text-lg font-bold text-gray-800">?�림 ?�스?�리</h3>
              <span className="text-red-600 text-sm font-medium">??미구??/span>
            </div>
            <p className="text-gray-600 text-sm text-center">
              발송 ?�력 �??�태 관�?            </p>
          </div>
          
          {/* ?�림 ?�정 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">?�️</div>
              <h3 className="text-lg font-bold text-gray-800">?�림 ?�정</h3>
              <span className="text-red-600 text-sm font-medium">??미구??/span>
            </div>
            <p className="text-gray-600 text-sm text-center">
              ?�용?�별 ?�림 ?�정
            </p>
          </div>
        </div>
        
        <div className="text-center mt-8">
          <Link
            to="/dashboard"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            ???�?�보?�로 ?�아가�?          </Link>
        </div>
      </div>
    </div>
  );
}
