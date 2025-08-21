import React, { useState, useEffect } from 'react';

interface CameraSelectorProps {
  onCameraChange: (deviceId: string) => void;
  currentDeviceId?: string;
  className?: string;
  theme?: 'light' | 'dark';
}

export default function CameraSelector({ 
  onCameraChange, 
  currentDeviceId, 
  className = '',
  theme = 'light'
}: CameraSelectorProps) {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 테마별 스타일
  const isDark = theme === 'dark';
  const textColor = isDark ? 'text-white' : 'text-gray-700';
  const borderColor = isDark ? 'border-gray-600' : 'border-gray-300';
  const bgColor = isDark ? 'bg-gray-800' : 'bg-white';
  const focusRing = isDark ? 'focus:ring-blue-400 focus:border-blue-400' : 'focus:ring-blue-500 focus:border-blue-500';

  // 사용 가능한 카메라 목록 조회
  const loadCameras = async () => {
    try {
      setIsLoading(true);
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setCameras(videoDevices);
    } catch (error) {
      console.error('카메라 목록 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 카메라 변경 시 호출
  const handleCameraChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = event.target.value;
    if (deviceId) {
      onCameraChange(deviceId);
    }
  };

  // 컴포넌트 마운트 시 카메라 목록 로드
  useEffect(() => {
    loadCameras();
  }, []);

  // 권한 변경 시 카메라 목록 새로고침
  useEffect(() => {
    const handleDeviceChange = () => {
      loadCameras();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, []);

  if (cameras.length === 0) {
    return null; // 카메라가 없으면 렌더링하지 않음
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className={`text-sm font-medium ${textColor}`}>
        카메라:
      </label>
      <select
        value={currentDeviceId || ''}
        onChange={handleCameraChange}
        disabled={isLoading}
        className={`px-3 py-1 text-sm border rounded-md transition-colors ${bgColor} ${borderColor} ${textColor} ${focusRing} disabled:opacity-50`}
      >
        {isLoading ? (
          <option>로딩 중...</option>
        ) : (
          cameras.map((camera) => (
            <option key={camera.deviceId} value={camera.deviceId}>
              {camera.label || `카메라 ${camera.deviceId.slice(0, 8)}...`}
            </option>
          ))
        )}
      </select>
      
      {/* 새로고침 버튼 */}
      <button
        onClick={loadCameras}
        disabled={isLoading}
        className={`p-1 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} disabled:opacity-50 transition-colors`}
        title="카메라 목록 새로고침"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  );
} 