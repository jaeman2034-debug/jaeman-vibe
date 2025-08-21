import React, { useEffect, useState } from 'react';
import { getQualityLevel, getQualityColorClass, getQualityIcon } from '../../lib/qualityUtils';

interface QualityScoreToastProps {
  qualityScore: number;
  isVisible: boolean;
  onClose: () => void;
  onRetake?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export default function QualityScoreToast({
  qualityScore,
  isVisible,
  onClose,
  onRetake,
  autoHide = true,
  autoHideDelay = 5000
}: QualityScoreToastProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      
      if (autoHide) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoHideDelay);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, autoHide, autoHideDelay]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300); // 애니메이션 완료 후 닫기
  };

  const handleRetake = () => {
    if (onRetake) {
      onRetake();
    }
    handleClose();
  };

  // 새로운 품질 평가 로직 사용
  const qualityLevel = getQualityLevel(qualityScore);
  const showRetakeButton = qualityLevel.level === 'low' || qualityLevel.level === 'mid';

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div
        className={`transform transition-all duration-300 ease-in-out ${
          isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        <div className={`border rounded-lg shadow-lg p-4 ${getQualityColorClass(qualityLevel.level)}`}>
          {/* 헤더 */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getQualityIcon(qualityLevel.level)}</span>
              <h3 className={`font-medium ${getQualityColorClass(qualityLevel.level).split(' ')[0]}`}>
                이미지 품질 점수
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* 품질 점수 표시 */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">품질 점수</span>
              <span className={`text-lg font-bold ${getQualityColorClass(qualityLevel.level).split(' ')[0]}`}>
                {qualityLevel.percentage}%
              </span>
            </div>
            
            {/* 점수 바 */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  qualityLevel.level === 'high' ? 'bg-green-500' :
                  qualityLevel.level === 'mid' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${qualityLevel.percentage}%` }}
              />
            </div>
            
            {/* 점수 구간 표시 */}
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>

          {/* 메시지 */}
          <p className={`text-sm ${getQualityColorClass(qualityLevel.level).split(' ')[0]} mb-3`}>
            {qualityLevel.message}
          </p>

          {/* 품질 상세 정보 */}
          <div className="text-xs text-gray-600 mb-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-medium">밝기:</span>
                <span className={`ml-1 ${
                  qualityLevel.level === 'high' ? 'text-green-600' :
                  qualityLevel.level === 'mid' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {qualityLevel.level === 'high' ? '최적' : qualityLevel.level === 'mid' ? '보통' : '낮음'}
                </span>
              </div>
              <div>
                <span className="font-medium">대비:</span>
                <span className={`ml-1 ${
                  qualityLevel.level === 'high' ? 'text-green-600' :
                  qualityLevel.level === 'mid' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {qualityLevel.level === 'high' ? '최적' : qualityLevel.level === 'mid' ? '보통' : '낮음'}
                </span>
              </div>
              <div>
                <span className="font-medium">선명도:</span>
                <span className={`ml-1 ${
                  qualityLevel.level === 'high' ? 'text-green-600' :
                  qualityLevel.level === 'mid' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {qualityLevel.level === 'high' ? '최적' : qualityLevel.level === 'mid' ? '보통' : '낮음'}
                </span>
              </div>
              <div>
                <span className="font-medium">크기:</span>
                <span className={`ml-1 ${
                  qualityLevel.level === 'high' ? 'text-green-600' :
                  qualityLevel.level === 'mid' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {qualityLevel.level === 'high' ? '최적' : qualityLevel.level === 'mid' ? '보통' : '낮음'}
                </span>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2">
            {showRetakeButton && onRetake && (
              <button
                onClick={handleRetake}
                className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
              >
                📸 다시 촬영
              </button>
            )}
            <button
              onClick={handleClose}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                showRetakeButton
                  ? 'flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'w-full bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {showRetakeButton ? '계속 사용' : '확인'}
            </button>
          </div>

          {/* 품질 개선 팁 */}
          {qualityLevel.level !== 'high' && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              <div className="font-medium mb-1">💡 품질 개선 팁:</div>
              <ul className="space-y-1">
                <li>• 밝은 곳에서 촬영하세요</li>
                <li>• 카메라를 흔들리지 않게 고정하세요</li>
                <li>• 상품에 초점을 맞추세요</li>
                <li>• 배경이 깔끔한 곳에서 촬영하세요</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 간단한 품질 점수 표시 컴포넌트
export function QualityScoreBadge({ score, size = 'sm' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const qualityLevel = getQualityLevel(score);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div className={`inline-flex items-center gap-1 ${sizeClasses[size]} border rounded-full font-medium ${getQualityColorClass(qualityLevel.level)}`}>
      <span className="text-xs">{getQualityIcon(qualityLevel.level)}</span>
      <span>{qualityLevel.percentage}%</span>
    </div>
  );
} 