import React, { useState } from 'react';
import CameraSelector from './CameraSelector';

interface CameraErrorGuideProps {
  error: string;
  onRetry: () => void;
  onSwitchCamera: (deviceId: string) => void;
  onFileUpload: () => void;
  onClose: () => void;
  className?: string;
}

export default function CameraErrorGuide({
  error,
  onRetry,
  onSwitchCamera,
  onFileUpload,
  onClose,
  className = ''
}: CameraErrorGuideProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 브라우저 설정 열기
  const openBrowserSettings = () => {
    if (navigator.userAgent.includes('Chrome')) {
      // Chrome 설정 페이지
      window.open('chrome://settings/content/camera', '_blank');
    } else if (navigator.userAgent.includes('Firefox')) {
      // Firefox 설정 페이지
      window.open('about:preferences#privacy', '_blank');
    } else if (navigator.userAgent.includes('Safari')) {
      // Safari 설정 안내
      alert('Safari > 환경설정 > 웹사이트 > 카메라에서 권한을 확인해주세요.');
    } else {
      // 일반적인 설정 안내
      alert('브라우저 설정에서 카메라 권한을 확인해주세요.');
    }
  };

  // 시스템 설정 열기 (Windows/macOS)
  const openSystemSettings = () => {
    if (navigator.userAgent.includes('Windows')) {
      // Windows 설정
      window.open('ms-settings:privacy-webcam', '_blank');
    } else if (navigator.userAgent.includes('Mac')) {
      // macOS 설정
      alert('시스템 환경설정 > 보안 및 개인 정보 보호 > 개인 정보 보호 > 카메라에서 권한을 확인해주세요.');
    } else {
      // 모바일 기기
      alert('기기 설정 > 개인정보 보호 > 카메라에서 권한을 확인해주세요.');
    }
  };

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
      {/* 에러 헤더 */}
      <div className="flex items-start gap-3 mb-4">
        <div className="text-red-500 text-2xl">📹</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800 mb-1">
            카메라 접근 오류
          </h3>
          <p className="text-red-600 text-sm">
            {error}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-red-400 hover:text-red-600 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* 빠른 해결 방법 */}
      <div className="space-y-3 mb-4">
        <button
          onClick={onRetry}
          className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-medium"
        >
          🔄 카메라 다시 시도
        </button>
        
        <button
          onClick={openBrowserSettings}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          🌐 브라우저 권한 허용
        </button>
        
        <button
          onClick={openSystemSettings}
          className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors font-medium"
        >
          ⚙️ 시스템 설정 열기
        </button>
      </div>

      {/* 고급 옵션 */}
      <div className="border-t border-red-200 pt-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-red-600 hover:text-red-800 text-sm font-medium mb-3"
        >
          {showAdvanced ? '▼' : '▶'} 고급 옵션
        </button>
        
        {showAdvanced && (
          <div className="space-y-3">
            {/* 카메라 선택 */}
            <div className="bg-white p-3 rounded border">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                다른 카메라 선택
              </label>
              <CameraSelector
                onCameraChange={onSwitchCamera}
                theme="light"
              />
            </div>
            
            {/* 파일 업로드 대안 */}
            <div className="bg-white p-3 rounded border">
              <p className="text-sm text-gray-600 mb-2">
                카메라가 작동하지 않나요?
              </p>
              <button
                onClick={onFileUpload}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors font-medium"
              >
                📁 파일로 업로드하기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 도움말 */}
      <div className="mt-4 p-3 bg-red-100 rounded text-xs text-red-700">
        <div className="font-medium mb-1">💡 문제 해결 팁:</div>
        <ul className="space-y-1">
          <li>• 다른 앱이 카메라를 사용 중인지 확인하세요</li>
          <li>• 브라우저를 새로고침하거나 재시작해보세요</li>
          <li>• 카메라 드라이버가 최신인지 확인하세요</li>
          <li>• 방화벽이나 보안 소프트웨어를 일시적으로 비활성화해보세요</li>
        </ul>
      </div>
    </div>
  );
} 