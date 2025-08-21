import React, { useState } from 'react';
import { AIProductAnalysis } from '../../components/ai/AIProductAnalysis';
import { MultiImageUpload } from '../../components/ai/MultiImageUpload';
import { useAIFeatures, type AIAnalysisResult } from '../../hooks/useAIFeatures';

type AnalysisMode = 'single' | 'multiple';

export default function AIProductWorkflow() {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('single');
  const [analysisResults, setAnalysisResults] = useState<AIAnalysisResult[]>([]);
  const { lastAnalysis, lastError, clearAnalysis } = useAIFeatures();

  const handleSingleAnalysisComplete = (result: AIAnalysisResult) => {
    setAnalysisResults(prev => [...prev, result]);
    setShowAnalysis(false);
    clearAnalysis();
  };

  const handleMultipleAnalysisComplete = (results: AIAnalysisResult[]) => {
    setAnalysisResults(prev => [...prev, ...results]);
    setShowAnalysis(false);
    clearAnalysis();
  };

  const handleCloseAnalysis = () => {
    setShowAnalysis(false);
    clearAnalysis();
  };

  const clearResults = () => {
    setAnalysisResults([]);
  };

  const openAnalysis = (mode: AnalysisMode) => {
    setAnalysisMode(mode);
    setShowAnalysis(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI 상품 분석 워크플로우
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            이미지를 업로드하면 AI가 자동으로 카테고리, 태그, 속성, 요약을 분석하여
            상품 등록을 도와드립니다.
          </p>
        </div>

        {/* 메인 액션 */}
        <div className="text-center mb-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => openAnalysis('single')}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              🚀 단일 이미지 AI 분석
            </button>
            <button
              onClick={() => openAnalysis('multiple')}
              className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors shadow-lg"
            >
              📸 다중 이미지 AI 분석
            </button>
          </div>
        </div>

        {/* 분석 결과 목록 */}
        {analysisResults.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                분석 결과 ({analysisResults.length})
              </h2>
              <button
                onClick={clearResults}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                모든 결과 지우기
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {analysisResults.map((result, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      분석 #{index + 1}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>

                  {/* 카테고리 */}
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-600">카테고리:</span>
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {result.category || '기타'}
                    </span>
                  </div>

                  {/* 태그 */}
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-600">태그:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {result.tags && result.tags.length > 0 ? (
                        result.tags.slice(0, 5).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">태그 없음</span>
                      )}
                      {result.tags && result.tags.length > 5 && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs">
                          +{result.tags.length - 5}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 속성 */}
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-600">속성:</span>
                    <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                      {result.attributes && Object.entries(result.attributes).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-gray-500">{key}:</span>
                          <span className="ml-1 text-gray-700">
                            {value || '알 수 없음'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 요약 */}
                  <div>
                    <span className="text-sm font-medium text-gray-600">요약:</span>
                    <p className="mt-1 text-gray-700 text-sm line-clamp-3">
                      {result.summary || '요약 없음'}
                    </p>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors">
                      상품 등록에 사용
                    </button>
                    <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors">
                      복사
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 기능 설명 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🎯 AI 상품 분석 기능
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ✨ 주요 기능
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• 이미지에서 상품 카테고리 자동 인식</li>
                <li>• 관련 태그 자동 생성 (3-8개)</li>
                <li>• 브랜드, 색상, 소재, 상태 등 속성 추출</li>
                <li>• 판매용 상품 요약 자동 생성</li>
                <li>• 드래그 앤 드롭 이미지 업로드</li>
                <li>• 커스텀 분석 지시사항 입력</li>
                <li>• 단일/다중 이미지 동시 분석</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🔧 기술 사양
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• 지원 형식: JPG, PNG, WebP</li>
                <li>• 최대 크기: 10MB (자동 압축)</li>
                <li>• AI 모델: GPT-4o-mini</li>
                <li>• 응답 시간: 평균 5-15초</li>
                <li>• 언어: 한국어 최적화</li>
                <li>• 실시간 진행률 표시</li>
                <li>• 다중 이미지 배치 처리</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">
              💡 사용 팁
            </h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• 상품이 명확하게 보이는 이미지를 사용하세요</li>
              <li>• 배경이 깨끗하고 조명이 좋은 사진이 분석 정확도를 높입니다</li>
              <li>• 커스텀 프롬프트로 특정 정보에 집중할 수 있습니다</li>
              <li>• 분석 결과는 상품 등록 폼에 자동으로 적용할 수 있습니다</li>
              <li>• 여러 이미지를 동시에 분석하면 비교 분석이 가능합니다</li>
            </ul>
          </div>
        </div>

        {/* AI 분석 모달 */}
        {showAnalysis && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              {analysisMode === 'single' ? (
                <AIProductAnalysis
                  onAnalysisComplete={handleSingleAnalysisComplete}
                  onClose={handleCloseAnalysis}
                />
              ) : (
                <MultiImageUpload
                  onAnalysisComplete={handleMultipleAnalysisComplete}
                  onClose={handleCloseAnalysis}
                  maxFiles={5}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 