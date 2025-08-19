import { useState, useCallback } from 'react';
import { ProductAnalysis, Location } from '../features/market/types';

interface AIFeaturesState {
  capturedImages: File[];
  analysis: ProductAnalysis | null;
  location: Location | null;
  isProcessing: boolean;
}

export function useAIFeatures() {
  const [state, setState] = useState<AIFeaturesState>({
    capturedImages: [],
    analysis: null,
    location: null,
    isProcessing: false
  });

  // 이미지 캡처 완료
  const handleImageCapture = useCallback((images: File[]) => {
    setState(prev => ({
      ...prev,
      capturedImages: images,
      isProcessing: true
    }));
  }, []);

  // AI 분석 완료
  const handleAnalysisComplete = useCallback((analysis: ProductAnalysis) => {
    setState(prev => ({
      ...prev,
      analysis,
      isProcessing: false
    }));
  }, []);

  // 위치 설정 완료
  const handleLocationSet = useCallback((location: Location) => {
    setState(prev => ({
      ...prev,
      location
    }));
  }, []);

  // 검색 결과 선택
  const handleSearchResultSelect = useCallback((itemId: string) => {
    // 실제로는 상품 상세 페이지로 이동
    console.log('선택된 상품:', itemId);
  }, []);

  // AI 워크플로우 시작
  const startAIWorkflow = useCallback(() => {
    setState(prev => ({
      ...prev,
      capturedImages: [],
      analysis: null,
      isProcessing: false
    }));
  }, []);

  // AI 워크플로우 완료
  const completeAIWorkflow = useCallback(() => {
    if (state.capturedImages.length > 0 && state.analysis) {
      // 실제로는 상품 등록 페이지로 이동하거나 데이터 전달
      console.log('AI 워크플로우 완료:', {
        images: state.capturedImages,
        analysis: state.analysis,
        location: state.location
      });
      
      return {
        success: true,
        data: {
          images: state.capturedImages,
          analysis: state.analysis,
          location: state.location
        }
      };
    }
    
    return {
      success: false,
      error: '필수 정보가 누락되었습니다.'
    };
  }, [state]);

  // 상태 초기화
  const resetState = useCallback(() => {
    setState({
      capturedImages: [],
      analysis: null,
      location: null,
      isProcessing: false
    });
  }, []);

  return {
    // 상태
    ...state,
    
    // 액션
    handleImageCapture,
    handleAnalysisComplete,
    handleLocationSet,
    handleSearchResultSelect,
    startAIWorkflow,
    completeAIWorkflow,
    resetState,
    
    // 유틸리티
    canProceed: state.capturedImages.length > 0 && state.analysis !== null,
    workflowProgress: {
      images: state.capturedImages.length > 0 ? 100 : 0,
      analysis: state.analysis ? 100 : 0,
      location: state.location ? 100 : 0
    }
  };
} 