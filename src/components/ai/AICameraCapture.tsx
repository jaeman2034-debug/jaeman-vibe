import React, { useState, useRef, useEffect, useCallback } from 'react';

interface AICameraCaptureProps {
  onCapture: (images: File[]) => void;
  onClose: () => void;
}

interface QualityCheck {
  focus: number;      // 라플라시안 분산 (선명도)
  brightness: number; // 평균 휘도
  stability: number;  // 흔들림 정도
  centering: number;  // 프레임 중앙 배치
  overall: number;    // 전체 점수
}

export default function AICameraCapture({ onCapture, onClose }: AICameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [capturedImages, setCapturedImages] = useState<File[]>([]);
  const [currentQuality, setCurrentQuality] = useState<QualityCheck | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 카메라 시작
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // 후면 카메라 우선
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          focusMode: 'continuous'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOn(true);
        setError(null);
      }
    } catch (err) {
      console.error('카메라 시작 실패:', err);
      setError('카메라를 시작할 수 없습니다. 권한을 확인해주세요.');
    }
  }, []);

  // 카메라 정지
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOn(false);
  }, []);

  // 품질 체크 (라플라시안 분산 기반)
  const checkQuality = useCallback((imageData: ImageData): QualityCheck => {
    const { data, width, height } = imageData;
    
    // 그레이스케일 변환 및 라플라시안 필터 적용
    let focus = 0;
    let brightness = 0;
    
    // 중앙 영역만 분석 (더 정확한 품질 체크)
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const regionSize = Math.min(width, height) * 0.6;
    
    for (let y = centerY - regionSize/2; y < centerY + regionSize/2; y++) {
      for (let x = centerX - regionSize/2; x < centerX + regionSize/2; x++) {
        if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          
          // 그레이스케일 변환
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          brightness += gray;
          
          // 라플라시안 필터 (선명도 측정)
          const laplacian = Math.abs(
            gray * 4 - 
            data[idx - 4] - data[idx + 4] - 
            data[(y-1) * width * 4 + x * 4] - 
            data[(y+1) * width * 4 + x * 4]
          );
          focus += laplacian;
        }
      }
    }
    
    const pixelCount = regionSize * regionSize;
    brightness = brightness / pixelCount / 255; // 0-1 정규화
    focus = focus / pixelCount / 255; // 0-1 정규화
    
    // 안정성과 중앙 배치는 현재 구현에서는 기본값 (실제로는 프레임 간 비교 필요)
    const stability = 0.8; // 임시값
    const centering = 0.9; // 임시값
    
    const overall = (focus * 0.4 + brightness * 0.3 + stability * 0.2 + centering * 0.1);
    
    return { focus, brightness, stability, centering, overall };
  }, []);

  // 실시간 품질 모니터링
  useEffect(() => {
    if (!isCameraOn || !videoRef.current || !canvasRef.current) return;

    const interval = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          ctx.drawImage(videoRef.current, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const quality = checkQuality(imageData);
          setCurrentQuality(quality);
        }
      }
    }, 500); // 500ms마다 품질 체크

    return () => clearInterval(interval);
  }, [isCameraOn, checkQuality]);

  // 촬영
  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    // 품질 체크
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const quality = checkQuality(imageData);

    // 품질이 좋지 않으면 경고
    if (quality.overall < 0.6) {
      setError('품질이 좋지 않습니다. 더 선명하게 촬영해주세요.');
      return;
    }

    // Canvas를 Blob으로 변환
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture_${Date.now()}.webp`, { type: 'image/webp' });
        setCapturedImages(prev => [...prev, file]);
        setError(null);
      }
    }, 'image/webp', 0.9);
  }, [checkQuality]);

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

      {/* 카메라 프리뷰 */}
      <div className="flex-1 relative">
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
        {currentQuality && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded">
            <div className="text-sm font-semibold mb-2">품질 점수</div>
            <div className="space-y-1 text-xs">
              <div>선명도: <span style={{color: getQualityColor(currentQuality.focus)}}>
                {Math.round(currentQuality.focus * 100)}%
              </span></div>
              <div>밝기: <span style={{color: getQualityColor(currentQuality.brightness)}}>
                {Math.round(currentQuality.brightness * 100)}%
              </span></div>
              <div>전체: <span style={{color: getQualityColor(currentQuality.overall)}}>
                {Math.round(currentQuality.overall * 100)}%
              </span></div>
            </div>
          </div>
        )}
      </div>

      {/* 컨트롤 */}
      <div className="bg-black p-4">
        <div className="flex justify-center space-x-4">
          <button
            onClick={captureImage}
            disabled={!isCameraOn || isAnalyzing}
            className="bg-red-600 text-white w-16 h-16 rounded-full disabled:opacity-50"
          >
            📸
          </button>
        </div>
        
        {/* 에러 메시지 */}
        {error && (
          <div className="text-red-400 text-center mt-2 text-sm">
            {error}
          </div>
        )}
        
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

      {/* 숨겨진 Canvas (품질 체크용) */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
} 