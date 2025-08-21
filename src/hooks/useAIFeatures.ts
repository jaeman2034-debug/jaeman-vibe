import { useState, useCallback } from 'react';
import { 
  analyzeProductImage, 
  analyzeMultipleImages,
  validateImageFile,
  getErrorMessage,
  type AIAnalysis 
} from '../services/aiService';

export interface AIAnalysisResult extends AIAnalysis {}

export interface AIAnalysisError {
  error: string;
  message: string;
}

export const useAIFeatures = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<AIAnalysisResult | null>(null);
  const [lastError, setLastError] = useState<AIAnalysisError | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const analyzeProductImageWithHook = useCallback(async (
    file: File, 
    prompt?: string
  ): Promise<AIAnalysisResult | null> => {
    setIsAnalyzing(true);
    setLastError(null);
    setAnalysisProgress(0);
    setCurrentFile(file);

    try {
      // 1. 파일 유효성 검사
      const validation = validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error || 'invalid-file');
      }

      // 2. 진행률 시뮬레이션 (사용자 경험 향상)
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      // 3. AI 분석 실행
      const result = await analyzeProductImage(file, prompt);
      
      // 4. 진행률 완료
      clearInterval(progressInterval);
      setAnalysisProgress(100);

      // 5. 결과 저장
      setLastAnalysis(result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'unknown-error';
      const userMessage = getErrorMessage(errorMessage);
      
      const aiError: AIAnalysisError = {
        error: errorMessage,
        message: userMessage
      };
      
      setLastError(aiError);
      console.error('[AI_ANALYZE] 분석 실패:', error);
      return null;
    } finally {
      setIsAnalyzing(false);
      setCurrentFile(null);
      // 진행률 초기화는 약간의 지연 후
      setTimeout(() => setAnalysisProgress(0), 1000);
    }
  }, []);

  const analyzeMultipleImagesWithHook = useCallback(async (
    files: File[], 
    prompt?: string
  ): Promise<AIAnalysisResult[]> => {
    setIsAnalyzing(true);
    setLastError(null);
    setAnalysisProgress(0);

    try {
      // 1. 모든 파일 유효성 검사
      const validations = files.map(file => validateImageFile(file));
      const invalidFiles = validations.filter(v => !v.valid);
      
      if (invalidFiles.length > 0) {
        const firstError = invalidFiles[0].error || 'invalid-file';
        throw new Error(firstError);
      }

      // 2. 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 5;
        });
      }, 300);

      // 3. 다중 이미지 분석
      const results = await analyzeMultipleImages(files, prompt);
      
      // 4. 진행률 완료
      clearInterval(progressInterval);
      setAnalysisProgress(100);

      // 5. 첫 번째 결과를 마지막 분석으로 설정
      if (results.length > 0 && !results[0].error) {
        setLastAnalysis(results[0]);
      }

      return results;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'unknown-error';
      const userMessage = getErrorMessage(errorMessage);
      
      const aiError: AIAnalysisError = {
        error: errorMessage,
        message: userMessage
      };
      
      setLastError(aiError);
      console.error('[AI_ANALYZE] 다중 이미지 분석 실패:', error);
      return [];
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setAnalysisProgress(0), 1000);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setLastAnalysis(null);
    setLastError(null);
    setAnalysisProgress(0);
    setCurrentFile(null);
  }, []);

  const getAnalysisStatus = useCallback(() => {
    if (isAnalyzing) return 'analyzing';
    if (lastError) return 'error';
    if (lastAnalysis) return 'success';
    return 'idle';
  }, [isAnalyzing, lastError, lastAnalysis]);

  const retryAnalysis = useCallback(async () => {
    if (currentFile) {
      return await analyzeProductImageWithHook(currentFile);
    }
    return null;
  }, [currentFile, analyzeProductImageWithHook]);

  return {
    // 상태
    isAnalyzing,
    lastAnalysis,
    lastError,
    analysisStatus: getAnalysisStatus(),
    analysisProgress,
    currentFile,
    
    // 액션
    analyzeProductImage: analyzeProductImageWithHook,
    analyzeMultipleImages: analyzeMultipleImagesWithHook,
    clearAnalysis,
    retryAnalysis,
    
    // 유틸리티
    hasAnalysis: !!lastAnalysis,
    hasError: !!lastError,
    canRetry: !!currentFile && !isAnalyzing,
    
    // 진행률 정보
    progressPercentage: Math.round(analysisProgress),
    isProgressComplete: analysisProgress >= 100,
  };
}; 