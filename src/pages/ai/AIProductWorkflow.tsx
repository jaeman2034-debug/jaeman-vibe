import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAIFeatures } from '../../hooks/useAIFeatures';
import AICameraCapture from '../../components/ai/AICameraCapture';
import AIProductAnalysis from '../../components/ai/AIProductAnalysis';
import LocationBasedSearch from '../../components/ai/LocationBasedSearch';
import AISearchRecommend from '../../components/ai/AISearchRecommend';

type WorkflowStep = 'start' | 'capture' | 'analysis' | 'location' | 'complete';

export default function AIProductWorkflow() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('start');
  const [showModal, setShowModal] = useState<string | null>(null);
  
  const {
    capturedImages,
    analysis,
    location,
    isProcessing,
    handleImageCapture,
    handleAnalysisComplete,
    handleLocationSet,
    startAIWorkflow,
    completeAIWorkflow,
    resetState,
    canProceed,
    workflowProgress
  } = useAIFeatures();

  // 워크플로우 시작
  const handleStartWorkflow = () => {
    startAIWorkflow();
    setCurrentStep('capture');
  };

  // 다음 단계로 진행
  const handleNextStep = () => {
    switch (currentStep) {
      case 'capture':
        if (capturedImages.length > 0) {
          setCurrentStep('analysis');
        }
        break;
      case 'analysis':
        if (analysis) {
          setCurrentStep('location');
        }
        break;
      case 'location':
        if (location) {
          setCurrentStep('complete');
        }
        break;
    }
  };

  // 이전 단계로 돌아가기
  const handlePrevStep = () => {
    switch (currentStep) {
      case 'analysis':
        setCurrentStep('capture');
        break;
      case 'location':
        setCurrentStep('analysis');
        break;
      case 'complete':
        setCurrentStep('location');
        break;
    }
  };

  // 워크플로우 완료
  const handleCompleteWorkflow = () => {
    const result = completeAIWorkflow();
    if (result.success) {
      // 상품 등록 페이지로 이동 (AI 분석 결과와 함께)
      navigate('/market/new', { 
        state: { 
          aiData: result.data,
          fromAI: true 
        } 
      });
    }
  };

  // 워크플로우 재시작
  const handleRestartWorkflow = () => {
    resetState();
    setCurrentStep('start');
  };

  // 진행률 계산
  const getProgressPercentage = () => {
    const totalSteps = 4;
    const completedSteps = Object.values(workflowProgress).filter(p => p === 100).length;
    return (completedSteps / totalSteps) * 100;
  };

  // 단계별 상태 표시
  const getStepStatus = (step: WorkflowStep) => {
    if (currentStep === step) return 'current';
    if (currentStep === 'complete' || 
        (step === 'capture' && capturedImages.length > 0) ||
        (step === 'analysis' && analysis) ||
        (step === 'location' && location)) {
      return 'completed';
    }
    return 'pending';
  };

  // 단계별 아이콘과 제목
  const getStepInfo = (step: WorkflowStep) => {
    switch (step) {
      case 'capture':
        return { icon: '📸', title: 'AI 촬영', desc: '상품을 촬영하고 품질을 체크합니다' };
      case 'analysis':
        return { icon: '🤖', title: 'AI 분석', desc: '이미지를 분석하여 상품 정보를 추출합니다' };
      case 'location':
        return { icon: '📍', title: '위치 설정', desc: '검색과 추천을 위한 위치를 설정합니다' };
      case 'complete':
        return { icon: '✅', title: '완료', desc: 'AI 워크플로우가 완료되었습니다' };
      default:
        return { icon: '🚀', title: '시작', desc: 'AI 상품 등록을 시작합니다' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI 상품 등록</h1>
              <p className="text-gray-600 mt-1">AI가 도와주는 스마트한 상품 등록</p>
            </div>
            <button
              onClick={() => navigate('/market')}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* 진행률 바 */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {Math.round(getProgressPercentage())}% 완료
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 단계별 진행 상황 */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {(['capture', 'analysis', 'location', 'complete'] as WorkflowStep[]).map((step) => {
            const status = getStepStatus(step);
            const info = getStepInfo(step);
            
            return (
              <div
                key={step}
                className={`text-center p-4 rounded-lg border-2 transition-all ${
                  status === 'current'
                    ? 'border-blue-500 bg-blue-50'
                    : status === 'completed'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className={`text-2xl mb-2 ${
                  status === 'completed' ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {status === 'completed' ? '✅' : info.icon}
                </div>
                <div className={`font-medium text-sm ${
                  status === 'current' ? 'text-blue-700' :
                  status === 'completed' ? 'text-green-700' : 'text-gray-500'
                }`}>
                  {info.title}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {info.desc}
                </div>
              </div>
            );
          })}
        </div>

        {/* 현재 단계 컨텐츠 */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          {currentStep === 'start' && (
            <div className="text-center">
              <div className="text-6xl mb-6">🤖</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                AI 상품 등록 시작
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                AI가 상품 촬영부터 분석까지 도와드립니다.
                간단한 과정으로 전문적인 상품 등록이 가능합니다.
              </p>
              <button
                onClick={handleStartWorkflow}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
              >
                시작하기
              </button>
            </div>
          )}

          {currentStep === 'capture' && (
            <div className="text-center">
              <div className="text-4xl mb-4">📸</div>
              <h3 className="text-xl font-semibold mb-4">AI 상품 촬영</h3>
              <p className="text-gray-600 mb-6">
                상품을 여러 각도에서 촬영하면 AI가 자동으로 품질을 체크하고
                최적의 이미지를 선택합니다.
              </p>
              <button
                onClick={() => setShowModal('camera')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                카메라 열기
              </button>
              {capturedImages.length > 0 && (
                <div className="mt-6">
                  <div className="text-sm text-gray-600 mb-2">
                    촬영된 이미지: {capturedImages.length}개
                  </div>
                  <button
                    onClick={handleNextStep}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    다음 단계
                  </button>
                </div>
              )}
            </div>
          )}

          {currentStep === 'analysis' && (
            <div className="text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-4">AI 상품 분석</h3>
              <p className="text-gray-600 mb-6">
                촬영된 이미지를 AI가 분석하여 카테고리, 브랜드, 모델,
                상태 등을 자동으로 추출합니다.
              </p>
              {!analysis ? (
                <button
                  onClick={() => setShowModal('analysis')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  AI 분석 시작
                </button>
              ) : (
                <div className="mt-6">
                  <div className="text-sm text-gray-600 mb-2">
                    분석 완료: {analysis.suggestedTitle}
                  </div>
                  <div className="flex space-x-3 justify-center">
                    <button
                      onClick={() => setShowModal('analysis')}
                      className="bg-gray-600 text-white px-4 py-2 rounded font-medium hover:bg-gray-700 transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700 transition-colors"
                    >
                      다음 단계
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 'location' && (
            <div className="text-center">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="text-xl font-semibold mb-4">위치 설정</h3>
              <p className="text-gray-600 mb-6">
                위치 정보를 설정하면 주변 상품 검색과
                지역 기반 추천 서비스를 이용할 수 있습니다.
              </p>
              {!location ? (
                <button
                  onClick={() => setShowModal('location')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  위치 설정
                </button>
              ) : (
                <div className="mt-6">
                  <div className="text-sm text-gray-600 mb-2">
                    위치 설정 완료: {location.address}
                  </div>
                  <div className="flex space-x-3 justify-center">
                    <button
                      onClick={() => setShowModal('location')}
                      className="bg-gray-600 text-white px-4 py-2 rounded font-medium hover:bg-gray-700 transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700 transition-colors"
                    >
                      다음 단계
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-semibold mb-4">AI 워크플로우 완료!</h3>
              <p className="text-gray-600 mb-6">
                모든 단계가 완료되었습니다. AI가 분석한 정보로
                상품을 등록하거나 검색/추천 서비스를 이용해보세요.
              </p>
              <div className="flex space-x-4 justify-center">
                <button
                  onClick={handleCompleteWorkflow}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  상품 등록하기
                </button>
                <button
                  onClick={() => setShowModal('search')}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  AI 검색/추천
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 네비게이션 버튼 */}
        {currentStep !== 'start' && currentStep !== 'complete' && (
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevStep}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400 transition-colors"
            >
              이전
            </button>
            <button
              onClick={handleRestartWorkflow}
              className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 transition-colors"
            >
              처음부터 다시
            </button>
          </div>
        )}
      </div>

      {/* 모달들 */}
      {showModal === 'camera' && (
        <AICameraCapture
          onCapture={handleImageCapture}
          onClose={() => setShowModal(null)}
        />
      )}

      {showModal === 'analysis' && capturedImages.length > 0 && (
        <AIProductAnalysis
          images={capturedImages}
          onAnalysisComplete={handleAnalysisComplete}
          onClose={() => setShowModal(null)}
        />
      )}

      {showModal === 'location' && (
        <LocationBasedSearch
          onLocationSet={handleLocationSet}
          onClose={() => setShowModal(null)}
        />
      )}

      {showModal === 'search' && (
        <AISearchRecommend
          onItemSelect={(itemId) => {
            setShowModal(null);
            navigate(`/market/${itemId}`);
          }}
          onClose={() => setShowModal(null)}
        />
      )}
    </div>
  );
} 