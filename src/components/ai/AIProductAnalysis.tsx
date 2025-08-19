import React, { useState, useEffect } from 'react';

interface ProductAnalysis {
  // 기본 정보
  category: string;
  brand: string;
  model: string;
  color: string;
  size: string;
  
  // 상태 및 품질
  condition: 'A' | 'B' | 'C'; // A: 최상, B: 상, C: 하
  defects: string[];
  
  // AI 생성 콘텐츠
  suggestedTitle: string;
  suggestedDescription: string;
  tags: string[];
  
  // AI 분석 결과
  ai: {
    quality_score: number;
    confidence: number;
    ocr: string[];
    embedding?: number[];
  };
}

interface AIProductAnalysisProps {
  images: File[];
  onAnalysisComplete: (analysis: ProductAnalysis) => void;
  onClose: () => void;
}

export default function AIProductAnalysis({ images, onAnalysisComplete, onClose }: AIProductAnalysisProps) {
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analysisStep, setAnalysisStep] = useState<'vision' | 'ocr' | 'embedding'>('vision');

  // AI 분석 실행 (Cloud Functions 호출 시뮬레이션)
  const analyzeImages = async () => {
    setIsAnalyzing(true);
    setProgress(0);
    setError(null);

    try {
      // 1단계: Vision AI 분석 (카테고리, 브랜드, 모델 등)
      setAnalysisStep('vision');
      await simulateProgress(0, 40, 100);

      // 2단계: OCR 텍스트 추출
      setAnalysisStep('ocr');
      await simulateProgress(40, 70, 100);

      // 3단계: 임베딩 생성 (선택사항)
      setAnalysisStep('embedding');
      await simulateProgress(70, 100, 100);

      // 분석 결과 생성 (실제로는 Cloud Functions에서 반환)
      const mockAnalysis: ProductAnalysis = {
        // 기본 정보
        category: '축구화',
        brand: 'NIKE',
        model: 'Mercurial Vapor 13 Elite',
        color: '블랙/골드',
        size: '270mm',
        
        // 상태 및 품질
        condition: 'B',
        defects: ['발끝 약간 마모', '뒤축 오염', '전반적으로 깨끗함'],
        
        // AI 생성 콘텐츠
        suggestedTitle: 'NIKE 머큐리얼 베이퍼 13 엘리트 블랙/골드 축구화 270mm',
        suggestedDescription: '프로 선수들이 사용하는 프리미엄 축구화입니다. 가벼운 무게와 뛰어난 접지력으로 스피드 플레이어에게 최적화되어 있습니다. FG 스터드로 잔디구장에서 사용 가능합니다.',
        tags: ['축구화', 'NIKE', '머큐리얼', '베이퍼13', '엘리트', 'FG', '270mm', '블랙', '골드', '중고'],
        
        // AI 분석 결과
        ai: {
          quality_score: 0.88,
          confidence: 0.92,
          ocr: ['NIKE', 'Mercurial Vapor 13 Elite', 'FG 270mm', 'Made in Vietnam'],
          embedding: [0.1, 0.2, 0.3, 0.4, 0.5] // 예시 벡터
        }
      };

      setAnalysis(mockAnalysis);
      
      // 완료 후 자동으로 결과 전달
      setTimeout(() => {
        onAnalysisComplete(mockAnalysis);
      }, 1000);

    } catch (err) {
      console.error('AI 분석 실패:', err);
      setError('AI 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 진행률 시뮬레이션
  const simulateProgress = async (start: number, end: number, duration: number) => {
    const steps = 10;
    const increment = (end - start) / steps;
    const interval = duration / steps;
    
    for (let i = 0; i < steps; i++) {
      await new Promise(resolve => setTimeout(resolve, interval));
      setProgress(prev => Math.min(prev + increment, end));
    }
  };

  // 컴포넌트 마운트 시 자동 분석 시작
  useEffect(() => {
    if (images.length > 0) {
      analyzeImages();
    }
  }, [images]);

  // 분석 결과 수정
  const updateAnalysis = (field: keyof ProductAnalysis, value: any) => {
    if (analysis) {
      setAnalysis(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  // AI 필드 수정
  const updateAIField = (field: keyof ProductAnalysis['ai'], value: any) => {
    if (analysis) {
      setAnalysis(prev => prev ? {
        ...prev,
        ai: { ...prev.ai, [field]: value }
      } : null);
    }
  };

  // 수동으로 분석 완료
  const handleManualComplete = () => {
    if (analysis) {
      onAnalysisComplete(analysis);
    }
  };

  // 상태 등급 설명
  const getConditionDescription = (condition: string) => {
    switch (condition) {
      case 'A': return '최상 - 새상품에 가까운 상태';
      case 'B': return '상 - 사용감이 있지만 깨끗한 상태';
      case 'C': return '하 - 사용감이 많고 마모가 심한 상태';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">AI 상품 분석</h2>
            <button onClick={onClose} className="text-white text-xl hover:text-blue-100">
              ✕
            </button>
          </div>
          <p className="text-blue-100 text-sm mt-1">
            이미지를 분석하여 카테고리, 브랜드, 상태 등을 자동으로 추출합니다
          </p>
        </div>

        {/* 분석 중 */}
        {isAnalyzing && (
          <div className="p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-xl font-medium mb-2">AI가 상품을 분석하고 있습니다</h3>
              
              {/* 분석 단계 표시 */}
              <div className="mb-4">
                <div className="flex items-center justify-center space-x-2 text-sm">
                  <div className={`px-3 py-1 rounded-full ${
                    analysisStep === 'vision' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    Vision AI
                  </div>
                  <div className={`px-3 py-1 rounded-full ${
                    analysisStep === 'ocr' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    OCR
                  </div>
                  <div className={`px-3 py-1 rounded-full ${
                    analysisStep === 'embedding' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    임베딩
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4">
                {analysisStep === 'vision' && '이미지에서 상품 정보를 추출하고 있습니다...'}
                {analysisStep === 'ocr' && '라벨과 상자에서 텍스트를 읽고 있습니다...'}
                {analysisStep === 'embedding' && '검색을 위한 벡터를 생성하고 있습니다...'}
              </p>
            </div>
            
            {/* 진행률 바 */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-500">{Math.round(progress)}% 완료</div>
          </div>
        )}

        {/* 분석 완료 */}
        {analysis && !isAnalyzing && (
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">AI 분석 결과</h3>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-gray-500">
                    품질 점수: <span className="font-semibold text-blue-600">{Math.round(analysis.ai.quality_score * 100)}%</span>
                  </div>
                  <div className="text-gray-500">
                    신뢰도: <span className="font-semibold text-green-600">{Math.round(analysis.ai.confidence * 100)}%</span>
                  </div>
                </div>
              </div>
              
              {/* 이미지 미리보기 */}
              <div className="flex space-x-2 mb-4 overflow-x-auto">
                {images.map((file, index) => (
                  <img
                    key={index}
                    src={URL.createObjectURL(file)}
                    alt={`분석 이미지 ${index + 1}`}
                    className="w-20 h-20 object-cover rounded border"
                  />
                ))}
              </div>
            </div>

            {/* 기본 정보 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                <select
                  value={analysis.category}
                  onChange={(e) => updateAnalysis('category', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="축구화">축구화</option>
                  <option value="유니폼">유니폼</option>
                  <option value="보호장비">보호장비</option>
                  <option value="볼/장비">볼/장비</option>
                  <option value="트레이닝">트레이닝</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">브랜드</label>
                <input
                  type="text"
                  value={analysis.brand}
                  onChange={(e) => updateAnalysis('brand', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="NIKE, Adidas, Puma..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">모델</label>
                <input
                  type="text"
                  value={analysis.model}
                  onChange={(e) => updateAnalysis('model', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Mercurial Vapor 13 Elite..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">색상</label>
                <input
                  type="text"
                  value={analysis.color}
                  onChange={(e) => updateAnalysis('color', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="블랙/골드, 화이트..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">사이즈</label>
                <input
                  type="text"
                  value={analysis.size}
                  onChange={(e) => updateAnalysis('size', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="270mm, L, M..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상태 등급</label>
                <select
                  value={analysis.condition}
                  onChange={(e) => updateAnalysis('condition', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="A">A - 최상</option>
                  <option value="B">B - 상</option>
                  <option value="C">C - 하</option>
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  {getConditionDescription(analysis.condition)}
                </div>
              </div>
            </div>

            {/* 결함/특징 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">결함/특징</label>
              <textarea
                value={analysis.defects.join('\n')}
                onChange={(e) => updateAnalysis('defects', e.target.value.split('\n').filter(Boolean))}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="발끝 약간 마모&#10;뒤축 오염&#10;전반적으로 깨끗함"
              />
            </div>

            {/* AI 생성 콘텐츠 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">제안 제목</label>
              <input
                type="text"
                value={analysis.suggestedTitle}
                onChange={(e) => updateAnalysis('suggestedTitle', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">제안 설명</label>
              <textarea
                value={analysis.suggestedDescription}
                onChange={(e) => updateAnalysis('suggestedDescription', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">태그</label>
              <input
                type="text"
                value={analysis.tags.join(', ')}
                onChange={(e) => updateAnalysis('tags', e.target.value.split(', ').filter(Boolean))}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="축구화, NIKE, 머큐리얼, 베이퍼13, 엘리트, FG, 270mm, 블랙, 골드, 중고"
              />
            </div>

            {/* AI 분석 결과 */}
            <div className="mb-6 p-4 bg-gray-50 rounded border">
              <h4 className="font-medium text-gray-900 mb-3">AI 분석 결과</h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">품질 점수</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={analysis.ai.quality_score}
                    onChange={(e) => updateAIField('quality_score', parseFloat(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">신뢰도</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={analysis.ai.confidence}
                    onChange={(e) => updateAIField('confidence', parseFloat(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">OCR 텍스트</label>
                <textarea
                  value={analysis.ai.ocr.join('\n')}
                  onChange={(e) => updateAIField('ocr', e.target.value.split('\n').filter(Boolean))}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="NIKE, Mercurial Vapor 13 Elite, FG 270mm, Made in Vietnam"
                />
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex space-x-3">
              <button
                onClick={handleManualComplete}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700"
              >
                분석 결과 사용
              </button>
              <button
                onClick={analyzeImages}
                className="flex-1 bg-gray-600 text-white py-3 px-4 rounded hover:bg-gray-700"
              >
                다시 분석
              </button>
            </div>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="p-6 text-center">
            <div className="text-red-600 mb-4">{error}</div>
            <button
              onClick={analyzeImages}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              다시 시도
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 