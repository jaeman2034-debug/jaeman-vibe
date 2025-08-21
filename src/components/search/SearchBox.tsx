import React, { useState, useCallback, useEffect } from 'react';
import { performTextSearch } from '../../services/searchService';
import type { SearchResult } from '../../features/market/types';

interface SearchBoxProps {
  query?: string;
  onSearchResults?: (results: SearchResult[]) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBox({ 
  query: initialQuery = '',
  onSearchResults, 
  placeholder = "상품명, 태그, 브랜드로 검색...",
  className = ""
}: SearchBoxProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  // 검색 실행
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      onSearchResults?.([]);
      return;
    }

    setIsSearching(true);
    try {
      const searchResults = await performTextSearch(searchQuery, undefined, 20);
      setResults(searchResults);
      onSearchResults?.(searchResults);
    } catch (error) {
      console.error('검색 실패:', error);
      setResults([]);
      onSearchResults?.([]);
    } finally {
      setIsSearching(false);
    }
  }, [onSearchResults]);

  // 입력 변경 시 디바운스 검색
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        handleSearch(query);
      } else {
        setResults([]);
        onSearchResults?.([]);
      }
    }, 300); // 300ms 디바운스

    return () => clearTimeout(timer);
  }, [query, handleSearch, onSearchResults]);

  // 외부 query prop 변경 시 내부 상태 동기화
  useEffect(() => {
    if (initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [initialQuery, query]);

  // 즉시 검색 (Enter 키)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-12 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
          disabled={isSearching}
        />
        
        {/* 검색 아이콘 */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
          {isSearching ? (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>

        {/* 검색 버튼 */}
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          검색
        </button>
      </form>

      {/* 검색 결과 미리보기 */}
      {results.length > 0 && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-100">
            <p className="text-sm text-gray-600">
              <span className="font-medium">{results.length}개</span>의 상품을 찾았습니다
            </p>
          </div>
          
          <div className="divide-y divide-gray-100">
            {results.slice(0, 8).map((item) => (
              <div
                key={item.id}
                className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => {
                  // 상품 상세 페이지로 이동
                  window.location.href = `/market/${item.id}`;
                }}
              >
                <div className="flex items-center space-x-3">
                  {/* 상품 이미지 */}
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        📷
                      </div>
                    )}
                  </div>

                  {/* 상품 정보 */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">
                      {item.category} • {item.region}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-bold text-blue-600">
                        {item.price.toLocaleString()}원
                      </span>
                      {item.ai?.quality_score && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {Math.round(item.ai.quality_score * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {results.length > 8 && (
            <div className="p-3 border-t border-gray-100 text-center">
              <button
                onClick={() => handleSearch(query)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                전체 결과 보기 ({results.length}개)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 