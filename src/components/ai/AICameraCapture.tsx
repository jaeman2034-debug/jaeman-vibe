import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCameraCapture } from '../../lib/useCameraCapture';
import { getQualityLevel, getQualityColorClass, getQualityIcon } from '../../lib/qualityUtils';
import CameraSelector from '../ui/CameraSelector';
import CameraErrorGuide from '../ui/CameraErrorGuide';

interface AICameraCaptureProps {
  onCapture: (images: File[]) => void;
  onClose: () => void;
}

export default function AICameraCapture({ onCapture, onClose }: AICameraCaptureProps) {
  const [capturedImages, setCapturedImages] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorGuide, setShowErrorGuide] = useState(false);
  const [currentCameraId, setCurrentCameraId] = useState<string>('');

  // useCameraCapture 훅 사용
  const { 
    videoRef, 
    canvasRef, 
    start, 
    stop, 
    takeShot, 
    quality, 
    setQuality,
    getAvailableCameras, 
    switchCamera 
  } = useCameraCapture();

  // 카메라 시작
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setShowErrorGuide(false);
      await start();
    } catch (err) {
      console.error('카메라 시작 실패:', err);
      const errorMessage = err instanceof Error ? err.message : '카메라를 시작할 수 없습니다.';
      setError(errorMessage);
      setShowErrorGuide(true);
    }
  }, [start]);

  // 카메라 정지
  const stopCamera = useCallback(() => {
    stop();
  }, [stop]);

  // 카메라 변경 처리
  const handleCameraChange = async (deviceId: string) => {
    try {
      setError(null);
      setShowErrorGuide(false);
      await switchCamera(deviceId);
      setCurrentCameraId(deviceId);
    } catch (error) {
      console.error('카메라 전환 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '카메라 전환에 실패했습니다.';
      setError(errorMessage);
      setShowErrorGuide(true);
    }
  };

  // 에러 가이드 닫기
  const handleCloseErrorGuide = () => {
    setShowErrorGuide(false);
    setError(null);
  };

  // 파일 업로드 대안
  const handleFileUpload = () => {
    // 파일 업로드 모드로 전환하거나 부모 컴포넌트에 알림
    onClose(); // 현재 카메라 모드를 닫고 파일 업로드 모드로 전환
  };

  // 품질 점수에 따른 UI 정보
  const qualityInfo = getQualityLevel(quality);

  // 촬영
  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    // 품질 체크 - useCameraCapture의 takeShot 사용
    const dataURL = takeShot();
    if (!dataURL) {
      setError('촬영에 실패했습니다.');
      return;
    }

    // 품질이 좋지 않으면 경고
    if (quality < 0.4) {
      setError('품질이 낮습니다. 더 선명하게 촬영해주세요.');
      return;
    }

    // dataURL을 File로 변환
    fetch(dataURL)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `capture_${Date.now()}.webp`, { type: 'image/webp' });
        setCapturedImages(prev => [...prev, file]);
        setError(null);
      })
      .catch(err => {
        console.error('파일 변환 실패:', err);
        setError('파일 변환에 실패했습니다.');
      });
  }, [takeShot, quality]);

  // 컴포넌트 마운트 시 카메라 시작
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // 촬영 완료
  const handleComplete = () => {
    if (capturedImages.length > 0) {
      onCapture(capturedImages);
    }
  };

  // 품질 점수에 따른 색상
  const getQualityColor = (score: number) => {
    if (score >= 0.8) return '#10b981'; // green
    if (score >= 0.6) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-black text-white p-4 flex justify-between items-center">
        <button onClick={onClose} className="text-white text-xl">✕</button>
        <h2 className="text-lg font-semibold">AI 상품 촬영</h2>
        <button 
          onClick={handleComplete}
          disabled={capturedImages.length === 0}
          className="bg-blue-600 px-4 py-2 rounded disabled:opacity-50"
        >
          완료 ({capturedImages.length})
        </button>
      </div>

      {/* 카메라 프리뷰 또는 에러 가이드 */}
      <div className="flex-1 relative">
        {showErrorGuide ? (
          // 에러 가이드 표시
          <div className="flex items-center justify-center h-full p-6">
            <CameraErrorGuide
              error={error || '알 수 없는 오류가 발생했습니다.'}
              onRetry={startCamera}
              onSwitchCamera={handleCameraChange}
              onFileUpload={handleFileUpload}
              onClose={handleCloseErrorGuide}
              className="max-w-md"
            />
          </div>
        ) : (
          // 정상 카메라 프리뷰
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* 가이드 오버레이 */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="border-2 border-white border-dashed m-8 rounded-lg">
                <div className="text-white text-center p-4">
                  <div className="text-sm">상품을 프레임 안에 배치하세요</div>
                  <div className="text-xs opacity-75">정면, 측면, 라벨 각도로 촬영</div>
                </div>
              </div>
            </div>

            {/* 품질 표시 */}
            {quality > 0 && (
              <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded">
                <div className="text-sm font-semibold mb-2">카메라 품질</div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span>{getQualityIcon(qualityInfo.level)}</span>
                    <span>{qualityInfo.percentage}%</span>
                  </div>
                  <div className="text-xs opacity-75">{qualityInfo.message}</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 컨트롤 - 에러 가이드가 표시될 때는 숨김 */}
      {!showErrorGuide && (
        <div className="bg-black p-4">
          {/* 카메라 선택기 */}
          <div className="mb-4">
            <CameraSelector
              onCameraChange={handleCameraChange}
              currentDeviceId={currentCameraId}
              theme="dark"
            />
          </div>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={captureImage}
              disabled={!videoRef.current || isAnalyzing}
              className="bg-red-600 text-white w-16 h-16 rounded-full disabled:opacity-50"
            >
              📸
            </button>
          </div>
          
          {/* 촬영된 이미지 미리보기 */}
          {capturedImages.length > 0 && (
            <div className="mt-4">
              <div className="text-white text-sm mb-2">촬영된 이미지 ({capturedImages.length}/5)</div>
              <div className="flex space-x-2 overflow-x-auto">
                {capturedImages.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`촬영 ${index + 1}`}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <button
                      onClick={() => setCapturedImages(prev => prev.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 숨겨진 Canvas (품질 체크용) */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
} 