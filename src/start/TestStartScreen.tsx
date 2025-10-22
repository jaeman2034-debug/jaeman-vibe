import React from "react";

export default function TestStartScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-8 rounded-lg shadow-xl">
        <h2 className="text-xl font-bold mb-4">스타트 스크린 테스트</h2>
        <p className="text-gray-600">화면이 정상적으로 나타납니다!</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
