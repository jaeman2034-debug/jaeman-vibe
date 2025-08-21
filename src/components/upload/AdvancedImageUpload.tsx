import React, { useState, useCallback, useRef, useImperativeHandle } from 'react';
import {
  removeBackgroundAndResize,
  calculateImageQuality,
  resizeImage,
} from '../../lib/backgroundRemovalUtils';

import QualityScoreToast from '../ui/QualityScoreToast';

interface AdvancedImageUploadProps {
  onImagesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // MB
  enableBackgroundRemoval?: boolean;
  enableQualityCheck?: boolean;
  qualityThreshold?: number; // 70% 미만 시 다시 촬영 권장
  className?: string;
}

const AdvancedImageUpload = React.forwardRef<{
  handleCameraCapture: (dataUrl: string) => void;
}, Omit<AdvancedImageUploadProps, 'onCameraCapture'>>(({
  onImagesSelected,
  maxFiles = 5,
  maxFileSize = 10, // 10MB
  enableBackgroundRemoval = true,
  enableQualityCheck = true,
  qualityThreshold = 70,
  className = ''
}, ref) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showQualityToast, setShowQualityToast] = useState(false);
  const [qualityScore, setQualityScore] = useState(0);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [backgroundRemovalEnabled, setBackgroundRemovalEnabled] = useState(enableBackgroundRemoval);
  const [backgroundRemovalQuality, setBackgroundRemovalQuality] = useState<'fast' | 'balanced' | 'high'>('balanced');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [failedUploads, setFailedUploads] = useState<{file: File, error: string}[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // 외부에서 접근할 수 있는 함수들
  useImperativeHandle(ref, () => ({
    handleCameraCapture: handleCameraCapture
  }), []);

  // 파일 유효성 검사
  const validateFile = (file: File): string | null => {
    // 파일 크기 검사
    if (file.size > maxFileSize * 1024 * 1024) {
      return `파일 크기가 ${maxFileSize}MB를 초과합니다.`;
    }

    // 파일 타입 검사
    if (!file.type.startsWith('image/')) {
      return '이미지 파일만 업로드할 수 있습니다.';
    }

    return null;
  };

  // 이미지 품질 체크
  const checkImageQuality = async (file: File): Promise<number> => {
    if (!enableQualityCheck) return 100;
    
    try {
      const score = await calculateImageQuality(file);
      setQualityScore(score);
      
      // 품질이 임계값 미만이면 토스트 표시
      if (score < qualityThreshold) {
        setCurrentFile(file);
        setShowQualityToast(true);
      }
      
      return score;
    } catch (error) {
      console.error('품질 점수 계산 실패:', error);
      return 100; // 에러 시 기본값
    }
  };

  // 이미지 포맷 변환 (간단한 리사이즈로 대체)
  const convertImageFormatHandler = async (file: File): Promise<File> => {
    try {
      // 포맷 변환 대신 리사이즈만 실행
      return await resizeImage(file, 1600, 1600, 0.9);
    } catch (error) {
      console.error('이미지 처리 실패:', error);
      return file; // 실패 시 원본 반환
    }
  };

  // 배경 제거 실행
  const processWithBackgroundRemoval = async (file: File): Promise<File> => {
    if (!backgroundRemovalEnabled) {
      return file;
    }

    try {
      setProcessingProgress(25);
      
      const result = await removeBackgroundAndResize(file, {}, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.86
      });

      if (!result.success || !result.blob) {
        throw new Error(result.error || '배경 제거에 실패했습니다.');
      }

      setProcessingProgress(75);

      // Blob을 File로 변환
      const processedFile = new File([result.blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
        type: 'image/webp'
      });

      setProcessingProgress(100);
      return processedFile;

    } catch (error) {
      console.error('배경 제거 처리 실패:', error);
      // 배경 제거 실패 시 원본 파일 반환
      return file;
    }
  };

  // 이미지 리사이즈
  const resizeImageFile = async (file: File): Promise<File> => {
    try {
      return await resizeImage(file, 1600, 1600, 0.86);
    } catch (error) {
      console.error('이미지 리사이즈 실패:', error);
      return file;
    }
  };

  // 파일 처리 파이프라인
  const processFile = async (file: File): Promise<File> => {
    // 1. 품질 체크
    await checkImageQuality(file);
    
    // 2. 배경 제거 (선택사항)
    let processedFile = await processWithBackgroundRemoval(file);
    
    // 3. 리사이즈
    processedFile = await resizeImageFile(processedFile);
    
    return processedFile;
  };

  // 업로드 롤백 함수
  const rollbackUploads = async () => {
    try {
      // 업로드된 파일들 정리
      for (const file of uploadedFiles) {
        // 메모리에서 파일 객체 해제
        if (file instanceof File && 'revokeObjectURL' in URL) {
          URL.revokeObjectURL(URL.createObjectURL(file));
        }
      }
      
      // 상태 초기화
      setUploadedFiles([]);
      setFailedUploads([]);
      
      console.log('업로드 롤백 완료');
    } catch (error) {
      console.error('롤백 중 오류:', error);
    }
  };

  // 파일 선택 처리
  const handleFileSelect = useCallback(async (files: FileList) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const validFiles: File[] = [];
      const errors: {file: File, error: string}[] = [];

      // 파일 유효성 검사
      for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
        const file = files[i];
        const error = validateFile(file);
        
        if (error) {
          errors.push({file, error});
        } else {
          validFiles.push(file);
        }
      }

      if (errors.length > 0) {
        setFailedUploads(prev => [...prev, ...errors]);
        console.error('파일 검증 오류:', errors);
      }

      if (validFiles.length === 0) {
        setIsProcessing(false);
        return;
      }

      // 파일 처리
      const processedFiles = await Promise.all(
        validFiles.map(async (file) => {
          try {
            return await processFile(file);
          } catch (error) {
            errors.push({file, error: `처리 실패: ${error}`});
            return null;
          }
        })
      );

      // 성공한 파일들만 필터링
      const successfulFiles = processedFiles.filter(Boolean) as File[];
      
      if (successfulFiles.length > 0) {
        setUploadedFiles(prev => [...prev, ...successfulFiles]);
        onImagesSelected(successfulFiles);
      }

      // 실패한 파일들 처리
      if (errors.length > 0) {
        setFailedUploads(prev => [...prev, ...errors]);
        console.error('파일 처리 오류:', errors);
        
        // 모든 파일이 실패한 경우 롤백
        if (successfulFiles.length === 0) {
          await rollbackUploads();
        }
      }

    } catch (error) {
      console.error('파일 처리 실패:', error);
      // 전체 실패 시 롤백
      await rollbackUploads();
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  }, [maxFiles, maxFileSize, onImagesSelected, enableQualityCheck, qualityThreshold, uploadedFiles]);

  // 파일 입력 변경
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFileSelect(files);
    }
  };

  // 드래그 앤 드롭 처리
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('border-blue-500', 'bg-blue-50');
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-blue-500', 'bg-blue-50');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-blue-500', 'bg-blue-50');
    }

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  // 다시 촬영 처리
  const handleRetake = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    setShowQualityToast(false);
  };

  // 카메라 촬영 처리 (외부에서 호출)
  const handleCameraCapture = useCallback(async (dataUrl: string) => {
    try {
      // dataURL을 Blob으로 변환
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Blob을 File로 변환
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // 파일 처리
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      handleFileSelect(dataTransfer.files);
      
    } catch (error) {
      console.error('카메라 촬영 처리 실패:', error);
      alert('카메라 촬영 처리 중 오류가 발생했습니다.');
    }
  }, [handleFileSelect]);

  return (
    <div className={className}>
      {/* 배경 제거 설정 */}
      {enableBackgroundRemoval && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={backgroundRemovalEnabled}
                onChange={(e) => setBackgroundRemovalEnabled(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              🎨 배경 제거 사용
            </label>
          </div>
          
          {backgroundRemovalEnabled && (
            <div className="ml-6">
              <label className="block text-xs text-gray-600 mb-1">품질 설정:</label>
              <select
                value={backgroundRemovalQuality}
                onChange={(e) => setBackgroundRemovalQuality(e.target.value as any)}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="fast">빠름 (낮은 품질)</option>
                <option value="balanced">균형 (보통 품질)</option>
                <option value="high">높음 (최고 품질)</option>
              </select>
            </div>
          )}
          

        </div>
      )}

      {/* 드래그 앤 드롭 영역 */}
      <div
        ref={dropZoneRef}
        className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-all duration-200 ${
          isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isProcessing ? (
          <div className="space-y-3">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-gray-600">이미지 처리 중...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">{processingProgress}%</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-4xl">📸</div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                이미지를 드래그하거나 클릭하여 선택
              </p>
              <p className="text-xs text-gray-500 mt-1">
                최대 {maxFiles}개, 각 {maxFileSize}MB 이하
              </p>
            </div>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              이미지 선택
            </button>
            
            <p className="text-xs text-gray-400">
              JPG, PNG, WebP 지원
              {enableBackgroundRemoval && backgroundRemovalEnabled && ' • 배경 제거 포함'}
            </p>
          </div>
        )}
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={isProcessing}
      />

      {/* 품질 점수 토스트 */}
      <QualityScoreToast
        qualityScore={qualityScore}
        isVisible={showQualityToast}
        onClose={() => setShowQualityToast(false)}
        onRetake={handleRetake}
        autoHide={false}
      />

      {/* 실패한 업로드 표시 */}
      {failedUploads.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-red-800 mb-2">
            <span>⚠️ 업로드 실패 ({failedUploads.length}개)</span>
          </div>
          <div className="space-y-2">
            {failedUploads.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="text-red-700 truncate">{item.file.name}</span>
                <span className="text-red-600">{item.error}</span>
              </div>
            ))}
          </div>
          <button
            onClick={rollbackUploads}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
          >
            실패한 파일 정리
          </button>
        </div>
      )}

      {/* 처리 상태 표시 */}
      {isProcessing && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <span>이미지 처리 중...</span>
          </div>
          <div className="mt-2 text-xs text-blue-600">
            {backgroundRemovalEnabled && '배경 제거 → '}리사이즈 → 최적화
          </div>
        </div>
      )}
    </div>
  );
});

export default AdvancedImageUpload; 