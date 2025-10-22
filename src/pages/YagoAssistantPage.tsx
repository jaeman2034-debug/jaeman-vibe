import React from "react";

export default function YagoAssistantPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">?���??�고 AI 비서</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">?�성 ?�식 AI ?�시?�턴??/h2>
          <p className="text-gray-600 mb-4">
            ?�성?�로 명령???�리�?AI?� ?�?�할 ???�는 ?�마??비서?�니??
          </p>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">?�� ?�성 명령</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>??"마켓?�로 ?�동?�줘"</li>
                <li>??"?�품 ?�록?�줘"</li>
                <li>??"블로�?보여�?</li>
                <li>??"?�설 찾아�?</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">?�� AI 기능</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>???�연??처리</li>
                <li>???�성 ?�식</li>
                <li>???�스???�성 변??/li>
                <li>???�마???�우??/li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-medium text-yellow-900 mb-2">?�️ 준�?�?/h3>
              <p className="text-sm text-yellow-800">
                ?�재 ?�성 ?�식 기능?� 개발 중입?�다. �??�용?�실 ???�습?�다!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
