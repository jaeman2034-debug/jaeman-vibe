import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, CheckCircle, AlertCircle, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { useAIFeatures, type AIAnalysisResult } from '../../hooks/useAIFeatures';
import { validateImageFile, getErrorMessage } from '../../services/aiService';

interface MultiImageUploadProps {
  onAnalysisComplete?: (results: AIAnalysisResult[]) => void;
  onClose?: () => void;
  maxFiles?: number;
  className?: string;
}

export const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  onAnalysisComplete,
  onClose,
  maxFiles = 5,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  
  const {
    isAnalyzing,
    lastAnalysis,
    lastError,
    analysisProgress,
    analyzeMultipleImages,
    clearAnalysis,
    retryAnalysis,
    hasAnalysis,
    hasError,
    canRetry,
    progressPercentage
  } = useAIFeatures();

  // 파일 선택 처리
  const handleFileSelect = useCallback((files: FileList) => {
    const newFiles = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    newFiles.forEach(file => {
      const validation = validateImageFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${getErrorMessage(validation.error || 'invalid-file')}`);
      }
    });

    if (errors.length > 0) {
      alert(`다음 파일들을 업로드할 수 없습니다:\n${errors.join('\n')}`);
    }

    if (validFiles.length > 0) {
      const totalFiles = selectedFiles.length + validFiles.length;
      if (totalFiles > maxFiles) {
        const allowed = maxFiles - selectedFiles.length;
        alert(`최대 ${maxFiles}개까지만 업로드할 수 있습니다. ${allowed}개만 추가됩니다.`);
        setSelectedFiles(prev => [...prev, ...validFiles.slice(0, allowed)]);
      } else {
        setSelectedFiles(prev => [...prev, ...validFiles]);
      }
    }

    clearAnalysis();
  }, [selectedFiles, maxFiles, clearAnalysis]);

  // 파일 제거
  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    clearAnalysis();
  }, [clearAnalysis]);

  // 모든 파일 제거
  const clearAllFiles = useCallback(() => {
    setSelectedFiles([]);
    clearAnalysis();
  }, [clearAnalysis]);

  // 파일 드롭 처리
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  // 드래그 오버 처리
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  // 드래그 리브 처리
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  // 다중 이미지 분석 시작
  const startAnalysis = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    try {
      const results = await analyzeMultipleImages(selectedFiles, customPrompt);
      if (results.length > 0 && onAnalysisComplete) {
        onAnalysisComplete(results);
      }
    } catch (error) {
      console.error('다중 이미지 분석 실패:', error);
    }
  }, [selectedFiles, customPrompt, analyzeMultipleImages, onAnalysisComplete]);

  // 재시도
  const handleRetry = useCallback(async () => {
    if (canRetry && selectedFiles.length > 0) {
      await analyzeMultipleImages(selectedFiles, customPrompt);
    }
  }, [canRetry, selectedFiles, customPrompt, analyzeMultipleImages]);

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-blue-600" />
          다중 이미지 AI 분석
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* 파일 업로드 영역 */}
      {selectedFiles.length === 0 ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className={`w-12 h-12 mx-auto mb-4 transition-colors ${
            dragActive ? 'text-blue-600' : 'text-gray-400'
          }`} />
          <p className="text-lg text-gray-600 mb-2">
            {dragActive ? '여기에 이미지를 놓으세요' : '이미지를 드래그하거나 클릭하여 업로드'}
          </p>
          <p className="text-sm text-gray-500">
            JPG, PNG, WebP (최대 10MB, 최대 {maxFiles}개)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files) {
                handleFileSelect(e.target.files);
              }
            }}
            className="hidden"
          />
        </div>
      ) : (
        /* 선택된 파일 목록 및 분석 */
        <div className="space-y-4">
          {/* 파일 목록 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative bg-gray-50 rounded-lg p-3 border">
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {file.name}
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-auto p-1 hover:bg-red-100 rounded-full transition-colors"
                  >
                    <X className="w-3 h-3 text-red-500" />
                  </button>
                </div>
                
                <div className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
                
                <div className="text-xs text-gray-500">
                  {file.type.split('/')[1].toUpperCase()}
                </div>
              </div>
            ))}
          </div>

          {/* 파일 관리 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
            >
              더 추가하기
            </button>
            <button
              onClick={clearAllFiles}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
            >
              모두 지우기
            </button>
          </div>

          {/* 커스텀 프롬프트 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              분석 지시사항 (선택사항)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="예: 이 스포츠용품들의 공통 특징과 차이점을 분석해주세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          {/* 분석 진행률 */}
          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>AI 분석 중... ({selectedFiles.length}개 이미지)</span>
                <span>{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* 분석 버튼 */}
          <button
            onClick={startAnalysis}
            disabled={isAnalyzing}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <RotateCcw className="w-5 h-5 animate-spin" />
                AI 분석 중... ({progressPercentage}%)
              </>
            ) : (
              <>
                <ImageIcon className="w-5 h-5" />
                {selectedFiles.length}개 이미지 AI 분석하기
              </>
            )}
          </button>
        </div>
      )}

      {/* 분석 결과 요약 */}
      {hasAnalysis && lastAnalysis && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-green-800">
              다중 이미지 분석 완료
            </h3>
          </div>
          
          <div className="text-sm text-gray-700 mb-3">
            {selectedFiles.length}개 이미지에 대한 AI 분석이 완료되었습니다.
          </div>

          {/* 첫 번째 결과 미리보기 */}
          <div className="bg-white rounded p-3 mb-3">
            <h4 className="font-medium text-gray-900 mb-2">첫 번째 이미지 분석 결과</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">카테고리:</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {lastAnalysis.category || '기타'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">요약:</span>
                <span className="ml-2 text-gray-700">
                  {lastAnalysis.summary || '요약 없음'}
                </span>
              </div>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex gap-2">
            <button
              onClick={clearAllFiles}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
            >
              새 이미지로 다시 분석
            </button>
            {canRetry && (
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                재시도
              </button>
            )}
          </div>
        </div>
      )}

      {/* 에러 표시 */}
      {hasError && lastError && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-800">분석 실패</h3>
          </div>
          <p className="text-red-700">{lastError.message}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => clearAnalysis()}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
            >
              닫기
            </button>
            {canRetry && (
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                재시도
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 