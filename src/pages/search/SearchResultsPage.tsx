import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { performTextSearch } from '../../services/searchService';
import type { SearchResult } from '../../features/market/types';
import SearchBox from '../../components/search/SearchBox';

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const query = searchParams.get('q') || '';
  const sortBy = searchParams.get('sort') || 'latest';

  // 검색 실행
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchResults = await performTextSearch(searchQuery, undefined, 50);
      
      // 정렬 적용
      const sortedResults = sortResults(searchResults, sortBy);
      setResults(sortedResults);
    } catch (err: any) {
      console.error('검색 실패:', err);
      setError('검색 중 오류가 발생했습니다.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 정렬 함수
  const sortResults = (items: SearchResult[], sortType: string): SearchResult[] => {
    switch (sortType) {
      case 'latest':
        return [...items].sort((a, b) => {
          // createdAt이 있으면 최신순, 없으면 관련성순
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return (b.relevance || 0) - (a.relevance || 0);
        });
      
      case 'relevance':
        return [...items].sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
      
      case 'price_asc':
        return [...items].sort((a, b) => a.price - b.price);
      
      case 'price_desc':
        return [...items].sort((a, b) => b.price - a.price);
      
      case 'distance':
        return [...items].sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      default:
        return items;
    }
  };

  // 정렬 변경
  const handleSortChange = (newSort: string) => {
    setSearchParams(prev => {
      prev.set('sort', newSort);
      return prev;
    });
  };

  // 검색어 변경
  const handleSearchChange = (newQuery: string) => {
    setSearchParams(prev => {
      if (newQuery.trim()) {
        prev.set('q', newQuery);
      } else {
        prev.delete('q');
      }
      return prev;
    });
  };

  // URL 파라미터 변경 시 검색 실행
  useEffect(() => {
    if (query) {
      performSearch(query);
    } else {
      setResults([]);
    }
  }, [query, sortBy]);

  // 검색 결과가 없을 때
  if (!query.trim()) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">상품 검색</h1>
          <p className="text-gray-600 mb-8">찾고 싶은 상품을 검색해보세요</p>
          <SearchBox 
            onSearchResults={setResults}
            className="max-w-2xl mx-auto"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              "{query}" 검색 결과
            </h1>
            <p className="text-gray-600">
              {isLoading ? '검색 중...' : `${results.length}개의 상품을 찾았습니다`}
            </p>
          </div>
          
          <SearchBox 
            query={query}
            onSearchResults={setResults}
            className="md:w-80"
          />
        </div>

        {/* 정렬 옵션 */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">정렬:</span>
          <div className="flex gap-2">
            {[
              { value: 'latest', label: '최신순' },
              { value: 'relevance', label: '관련성순' },
              { value: 'price_asc', label: '가격 낮은순' },
              { value: 'price_desc', label: '가격 높은순' },
              { value: 'distance', label: '거리순' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  sortBy === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 검색 결과 */}
      {isLoading && (
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">검색 중입니다...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-16">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => performSearch(query)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      )}

      {!isLoading && !error && results.length === 0 && (
        <div className="text-center py-16">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
          <p className="text-gray-600 mb-6">
            "{query}"에 대한 검색 결과를 찾을 수 없습니다.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">다른 검색어를 시도해보세요:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['축구화', '유니폼', '보호장비', 'NIKE', 'Adidas'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSearchChange(suggestion)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {results.map((item) => (
            <Link
              key={item.id}
              to={`/market/${item.id}`}
              className="group block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              {/* 상품 이미지 */}
              <div className="aspect-square bg-gray-100 overflow-hidden">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                    📷
                  </div>
                )}
              </div>

              {/* 상품 정보 */}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-blue-600">
                    {item.price.toLocaleString()}원
                  </span>
                  {item.ai?.quality_score && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {Math.round(item.ai.quality_score * 100)}%
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{item.category}</span>
                  <span>{item.region}</span>
                </div>

                {/* AI 태그 */}
                {item.ai?.tags && item.ai.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {item.ai.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 거리 정보 */}
                {item.distance !== undefined && (
                  <div className="mt-2 text-xs text-gray-500">
                    📍 {item.distance < 1 
                      ? `${Math.round(item.distance * 1000)}m` 
                      : `${item.distance.toFixed(1)}km`
                    }
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 페이지네이션 (필요시) */}
      {results.length >= 50 && (
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            더 많은 결과가 있습니다. 검색어를 구체적으로 입력해보세요.
          </p>
        </div>
      )}
    </div>
  );
} 