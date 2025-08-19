import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { SearchResult, MarketItem, Location } from '../../features/market/types';
import { searchItemsByLocation, calculateLocationScore } from '../../services/locationService';

interface AISearchRecommendProps {
  userLocation?: Location;
  onItemSelect: (itemId: string) => void;
  onClose: () => void;
}

type SearchType = 'text' | 'image' | 'voice' | 'semantic';

export default function AISearchRecommend({ userLocation, onItemSelect, onClose }: AISearchRecommendProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('text');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: '',
    priceRange: { min: 0, max: 1000000 },
    condition: '',
    radiusKm: userLocation ? 10 : 50
  });
  const [sortBy, setSortBy] = useState<'relevance' | 'distance' | 'price' | 'freshness'>('relevance');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceRecognitionRef = useRef<any>(null);

  // 검색 실행
  const performSearch = useCallback(async () => {
    if (!searchQuery.trim() && searchType === 'text') return;

    setIsSearching(true);
    setError(null);

    try {
      let searchResults: SearchResult[] = [];

      switch (searchType) {
        case 'text':
          searchResults = await performTextSearch(searchQuery, filters);
          break;
        case 'image':
          searchResults = await performImageSearch(searchQuery, filters);
          break;
        case 'voice':
          searchResults = await performVoiceSearch(searchQuery, filters);
          break;
        case 'semantic':
          searchResults = await performSemanticSearch(searchQuery, filters);
          break;
      }

      // 가중치 기반 랭킹 적용
      const rankedResults = applyWeightedRanking(searchResults, userLocation);
      setResults(rankedResults);

      // 검색 히스토리에 추가
      if (searchQuery.trim()) {
        setSearchHistory(prev => {
          const newHistory = [searchQuery, ...prev.filter(h => h !== searchQuery)].slice(0, 10);
          return newHistory;
        });
      }

    } catch (err: any) {
      console.error('검색 실패:', err);
      setError('검색 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, searchType, filters, userLocation]);

  // 텍스트 검색 (Algolia/Meilisearch 시뮬레이션)
  const performTextSearch = async (query: string, filters: any): Promise<SearchResult[]> => {
    // 실제로는 Algolia/Meilisearch API 호출
    // 여기서는 Firestore 기반 시뮬레이션
    
    const mockResults: SearchResult[] = [
      {
        id: '1',
        title: 'NIKE 머큐리얼 베이퍼 13 엘리트',
        description: '프로 선수들이 사용하는 프리미엄 축구화',
        price: 150000,
        category: '축구화',
        region: '서울',
        distance: userLocation ? 2.5 : undefined,
        relevance: 0.95,
        imageUrl: '/mock-soccer-shoe.jpg',
        ai: { quality_score: 0.88, confidence: 0.92 }
      },
      {
        id: '2',
        title: 'Adidas 프레데터 FG 축구화',
        description: '뛰어난 접지력과 컨트롤',
        price: 120000,
        category: '축구화',
        region: '서울',
        distance: userLocation ? 1.8 : undefined,
        relevance: 0.87,
        imageUrl: '/mock-adidas-shoe.jpg',
        ai: { quality_score: 0.82, confidence: 0.89 }
      }
    ];

    // 필터링 적용
    return mockResults.filter(item => {
      if (filters.category && item.category !== filters.category) return false;
      if (item.price < filters.priceRange.min || item.price > filters.priceRange.max) return false;
      if (filters.condition && item.ai?.quality_score) {
        const condition = item.ai.quality_score > 0.8 ? 'A' : item.ai.quality_score > 0.6 ? 'B' : 'C';
        if (condition !== filters.condition) return false;
      }
      return true;
    });
  };

  // 이미지 검색 (CLIP/OpenAI Vision 시뮬레이션)
  const performImageSearch = async (query: string, filters: any): Promise<SearchResult[]> => {
    // 실제로는 이미지 임베딩 생성 후 벡터 DB 검색
    // 여기서는 시뮬레이션
    
    const mockResults: SearchResult[] = [
      {
        id: '3',
        title: '유사한 축구화 이미지 검색 결과',
        description: '업로드한 이미지와 유사한 상품',
        price: 180000,
        category: '축구화',
        region: '부산',
        distance: userLocation ? 320 : undefined,
        relevance: 0.78,
        imageUrl: '/mock-similar-shoe.jpg',
        ai: { quality_score: 0.75, confidence: 0.81 }
      }
    ];

    return mockResults;
  };

  // 음성 검색 (Web Speech API 시뮬레이션)
  const performVoiceSearch = async (query: string, filters: any): Promise<SearchResult[]> => {
    // 실제로는 Web Speech API 사용
    // 여기서는 시뮬레이션
    
    const mockResults: SearchResult[] = [
      {
        id: '4',
        title: '음성 검색 결과: 축구화',
        description: '음성으로 검색한 축구화 상품',
        price: 95000,
        category: '축구화',
        region: '인천',
        distance: userLocation ? 45 : undefined,
        relevance: 0.72,
        imageUrl: '/mock-voice-result.jpg',
        ai: { quality_score: 0.68, confidence: 0.75 }
      }
    ];

    return mockResults;
  };

  // 의미 검색 (임베딩 기반 시뮬레이션)
  const performSemanticSearch = async (query: string, filters: any): Promise<SearchResult[]> => {
    // 실제로는 OpenAI/Vertex AI 임베딩 생성 후 Pinecone/Weaviate 검색
    // 여기서는 시뮬레이션
    
    const mockResults: SearchResult[] = [
      {
        id: '5',
        title: '의미적 유사성 기반 검색 결과',
        description: '임베딩 벡터 유사도로 찾은 상품',
        price: 135000,
        category: '축구화',
        region: '대구',
        distance: userLocation ? 280 : undefined,
        relevance: 0.91,
        imageUrl: '/mock-semantic-result.jpg',
        ai: { quality_score: 0.85, confidence: 0.88 }
      }
    ];

    return mockResults;
  };

  // 가중치 기반 랭킹 적용
  const applyWeightedRanking = (results: SearchResult[], userLocation?: Location): (SearchResult & { finalScore: number })[] => {
    return results.map(item => {
      let finalScore = 0;
      
      // Relevance 가중치 (60%)
      finalScore += (item.relevance || 0) * 0.6;
      
      // Distance 가중치 (20%) - 사용자 위치가 있을 때만
      if (userLocation && item.distance !== undefined) {
        const distanceScore = Math.max(0, 1 - (item.distance / 50)); // 50km 기준 정규화
        finalScore += distanceScore * 0.2;
      }
      
      // Freshness 가중치 (20%) - 최신 상품 우선
      const freshnessScore = 0.8; // 실제로는 createdAt 기반 계산
      finalScore += freshnessScore * 0.2;
      
      return { ...item, finalScore };
    }).sort((a, b) => b.finalScore - a.finalScore);
  };

  // 이미지 업로드 처리
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSearchType('image');
      setSearchQuery(`이미지 검색: ${file.name}`);
      // 실제로는 이미지 임베딩 생성 후 검색
    }
  };

  // 음성 검색 시작
  const startVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      voiceRecognitionRef.current = new SpeechRecognition();
      
      voiceRecognitionRef.current.continuous = false;
      voiceRecognitionRef.current.interimResults = false;
      voiceRecognitionRef.current.lang = 'ko-KR';
      
      voiceRecognitionRef.current.onstart = () => {
        setSearchType('voice');
        setIsSearching(true);
      };
      
      voiceRecognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        voiceRecognitionRef.current.stop();
      };
      
      voiceRecognitionRef.current.onerror = () => {
        setIsSearching(false);
        setError('음성 인식에 실패했습니다.');
      };
      
      voiceRecognitionRef.current.onend = () => {
        setIsSearching(false);
        if (searchQuery.trim()) {
          performSearch();
        }
      };
      
      voiceRecognitionRef.current.start();
    } else {
      setError('이 브라우저는 음성 인식을 지원하지 않습니다.');
    }
  };

  // 음성 검색 중지
  const stopVoiceSearch = () => {
    if (voiceRecognitionRef.current) {
      voiceRecognitionRef.current.stop();
    }
  };

  // 검색 히스토리 클릭
  const handleHistoryClick = (historyItem: string) => {
    setSearchQuery(historyItem);
    setSearchType('text');
  };

  // 검색 실행 (디바운스)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() && searchType === 'text') {
        performSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchType, performSearch]);

  // 정렬 변경 시 결과 재정렬
  useEffect(() => {
    if (results.length > 0) {
      const sortedResults = [...results];
      switch (sortBy) {
        case 'relevance':
          sortedResults.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
          break;
        case 'distance':
          sortedResults.sort((a, b) => (a.distance || 0) - (b.distance || 0));
          break;
        case 'price':
          sortedResults.sort((a, b) => a.price - b.price);
          break;
        case 'freshness':
          // 실제로는 createdAt 기반 정렬
          break;
      }
      setResults(sortedResults);
    }
  }, [sortBy]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">🔍 AI 검색 & 추천</h2>
            <button onClick={onClose} className="text-white text-xl hover:text-purple-100">
              ✕
            </button>
          </div>
          <p className="text-purple-100 text-sm mt-1">
            텍스트, 이미지, 음성, 의미 검색으로 원하는 상품을 찾아보세요
          </p>
        </div>

        <div className="p-6">
          {/* 검색 타입 선택 */}
          <div className="mb-6">
            <div className="flex space-x-2 mb-4">
              {(['text', 'image', 'voice', 'semantic'] as SearchType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSearchType(type)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    searchType === type
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type === 'text' && '📝 텍스트'}
                  {type === 'image' && '🖼️ 이미지'}
                  {type === 'voice' && '🎤 음성'}
                  {type === 'semantic' && '🧠 의미'}
                </button>
              ))}
            </div>
          </div>

          {/* 검색 입력 */}
          <div className="mb-6">
            {searchType === 'text' && (
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="상품명, 브랜드, 특징 등을 입력하세요..."
                  className="w-full p-4 pr-12 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={performSearch}
                  disabled={!searchQuery.trim() || isSearching}
                  className="absolute right-2 top-2 bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  🔍
                </button>
              </div>
            )}

            {searchType === 'image' && (
              <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
                >
                  🖼️ 이미지 업로드
                </button>
                <p className="text-gray-600 mt-2">이미지로 유사한 상품을 찾아보세요</p>
              </div>
            )}

            {searchType === 'voice' && (
              <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                {!isSearching ? (
                  <button
                    onClick={startVoiceSearch}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
                  >
                    🎤 음성 검색 시작
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-600">음성을 인식하고 있습니다...</p>
                    <button
                      onClick={stopVoiceSearch}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      중지
                    </button>
                  </div>
                )}
                <p className="text-gray-600 mt-2">음성으로 검색어를 말해주세요</p>
              </div>
            )}

            {searchType === 'semantic' && (
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="의미적으로 유사한 상품을 찾아보세요..."
                  className="w-full p-4 pr-12 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={performSearch}
                  disabled={!searchQuery.trim() || isSearching}
                  className="absolute right-2 top-2 bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  🧠
                </button>
              </div>
            )}
          </div>

          {/* 검색 히스토리 */}
          {searchHistory.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">최근 검색어</h3>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((historyItem, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistoryClick(historyItem)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
                  >
                    {historyItem}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 고급 필터 */}
          <div className="mb-6">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              {showAdvancedFilters ? '필터 숨기기' : '고급 필터 보기'} ▼
            </button>
            
            {showAdvancedFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* 카테고리 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">전체</option>
                      <option value="축구화">축구화</option>
                      <option value="유니폼">유니폼</option>
                      <option value="보호장비">보호장비</option>
                      <option value="볼/장비">볼/장비</option>
                      <option value="트레이닝">트레이닝</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>

                  {/* 가격 범위 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">최소 가격</label>
                    <input
                      type="number"
                      value={filters.priceRange.min}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        priceRange: { ...prev.priceRange, min: Number(e.target.value) }
                      }))}
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">최대 가격</label>
                    <input
                      type="number"
                      value={filters.priceRange.max}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        priceRange: { ...prev.priceRange, max: Number(e.target.value) }
                      }))}
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* 상태 등급 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">상태 등급</label>
                    <select
                      value={filters.condition}
                      onChange={(e) => setFilters(prev => ({ ...prev, condition: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">전체</option>
                      <option value="A">A - 최상</option>
                      <option value="B">B - 상</option>
                      <option value="C">C - 하</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 정렬 옵션 */}
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">정렬:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
              >
                <option value="relevance">관련도순</option>
                <option value="distance">거리순</option>
                <option value="price">가격순</option>
                <option value="freshness">최신순</option>
              </select>
            </div>
            
            {results.length > 0 && (
              <p className="text-sm text-gray-600">
                총 <span className="font-semibold">{results.length}개</span>의 결과
              </p>
            )}
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* 검색 결과 */}
          <div>
            {isSearching && (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">AI가 검색하고 있습니다...</p>
                <p className="text-sm text-gray-500 mt-1">
                  {searchType === 'text' && '텍스트 분석 중...'}
                  {searchType === 'image' && '이미지 분석 중...'}
                  {searchType === 'voice' && '음성 인식 중...'}
                  {searchType === 'semantic' && '의미 분석 중...'}
                </p>
              </div>
            )}

            {!isSearching && results.length === 0 && searchQuery && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-4">🔍</div>
                <p className="text-gray-600">검색 결과가 없습니다.</p>
                <p className="text-sm text-gray-500 mt-1">다른 검색어나 필터를 시도해보세요.</p>
              </div>
            )}

            {!isSearching && results.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onItemSelect(item.id)}
                    className="border rounded-lg p-4 hover:shadow-lg transition cursor-pointer group"
                  >
                    {/* 상품 이미지 */}
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    </div>

                    {/* 상품 정보 */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 line-clamp-2 group-hover:text-purple-600 transition">
                        {item.title}
                      </h4>
                      
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {item.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-purple-600">
                          {item.price.toLocaleString()}원
                        </span>
                        {item.distance !== undefined && (
                          <span className="text-sm text-gray-500">
                            📍 {item.distance < 1 ? `${Math.round(item.distance * 1000)}m` : `${item.distance.toFixed(1)}km`}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{item.category}</span>
                        <span className="text-gray-500">{item.region}</span>
                      </div>

                      {/* AI 품질 점수 */}
                      {item.ai?.quality_score && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">품질 점수</span>
                            <span className="text-gray-700 font-medium">
                              {Math.round(item.ai.quality_score * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full transition-all"
                              style={{ width: `${item.ai.quality_score * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* 랭킹 점수 */}
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">종합 점수</span>
                          <span className="text-purple-600 font-semibold">
                            {Math.round(((item as any).finalScore || 0) * 100)}점
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${((item as any).finalScore || 0) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 