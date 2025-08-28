import { useState, useCallback } from 'react';

export interface FilterOptions {
  searchTerm: string;
  category: string;
  dong: string;
  priceMin?: number;
  priceMax?: number;
  dateFrom?: string;
  dateTo?: string;
  sortBy: 'createdAt' | 'price' | 'title';
  sortOrder: 'asc' | 'desc';
}

interface AdvancedFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  categories: string[];
  dongs: string[];
  showPriceFilter?: boolean;
  showDateFilter?: boolean;
}

export default function AdvancedFilters({
  filters,
  onFiltersChange,
  categories,
  dongs,
  showPriceFilter = true,
  showDateFilter = true
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = useCallback((key: keyof FilterOptions, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  }, [filters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    onFiltersChange({
      searchTerm: '',
      category: '',
      dong: '',
      priceMin: undefined,
      priceMax: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  }, [onFiltersChange]);

  const hasActiveFilters = filters.searchTerm || 
    filters.category || 
    filters.dong || 
    filters.priceMin || 
    filters.priceMax || 
    filters.dateFrom || 
    filters.dateTo || 
    filters.sortBy !== 'createdAt' || 
    filters.sortOrder !== 'desc';

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* 기본 검색 */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="검색어를 입력하세요..."
          value={filters.searchTerm}
          onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          style={{ 
            flex: 1, 
            padding: '12px 16px', 
            borderRadius: 8, 
            border: '1px solid #ddd',
            fontSize: 16
          }}
        />
        <button
          data-voice-action="search"
          onClick={() => {/* 검색 실행 */}}
          style={{ 
            padding: '12px 24px', 
            background: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          검색
        </button>
      </div>

      {/* 기본 필터 */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* 카테고리 필터 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 14, fontWeight: 500 }}>카테고리:</label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            style={{ 
              padding: '8px 12px', 
              borderRadius: 6, 
              border: '1px solid #ddd',
              minWidth: 120
            }}
          >
            <option value="">전체</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* 행정동 필터 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 14, fontWeight: 500 }}>행정동:</label>
          <select
            value={filters.dong}
            onChange={(e) => handleFilterChange('dong', e.target.value)}
            style={{ 
              padding: '8px 12px', 
              borderRadius: 6, 
              border: '1px solid #ddd',
              minWidth: 120
            }}
          >
            <option value="">전체</option>
            {dongs.map(dong => (
              <option key={dong} value={dong}>{dong}</option>
            ))}
          </select>
        </div>

        {/* 정렬 옵션 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 14, fontWeight: 500 }}>정렬:</label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            style={{ 
              padding: '8px 12px', 
              borderRadius: 6, 
              border: '1px solid #ddd',
              minWidth: 100
            }}
          >
            <option value="createdAt">등록일</option>
            <option value="price">가격</option>
            <option value="title">제목</option>
          </select>
          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            style={{ 
              padding: '8px 12px', 
              borderRadius: 6, 
              border: '1px solid #ddd',
              minWidth: 80
            }}
          >
            <option value="desc">내림차순</option>
            <option value="asc">오름차순</option>
          </select>
        </div>

        {/* 고급 필터 토글 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            padding: '8px 16px',
            background: isExpanded ? '#6c757d' : '#f8f9fa',
            color: isExpanded ? 'white' : '#333',
            border: '1px solid #dee2e6',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          {isExpanded ? '간단히' : '고급'}
        </button>
      </div>

      {/* 고급 필터 (접을 수 있음) */}
      {isExpanded && (
        <div style={{ 
          display: 'grid', 
          gap: 16, 
          padding: 20, 
          border: '1px solid #e9ecef', 
          borderRadius: 8,
          backgroundColor: '#f8f9fa'
        }}>
          {/* 가격 범위 필터 */}
          {showPriceFilter && (
            <div style={{ display: 'grid', gap: 12 }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>가격 범위</h4>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 14 }}>최소:</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.priceMin || ''}
                    onChange={(e) => handleFilterChange('priceMin', e.target.value ? Number(e.target.value) : undefined)}
                    style={{ 
                      padding: '8px 12px', 
                      borderRadius: 6, 
                      border: '1px solid #ddd',
                      width: 120
                    }}
                  />
                  <span style={{ fontSize: 14 }}>원</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 14 }}>최대:</label>
                  <input
                    type="number"
                    placeholder="무제한"
                    value={filters.priceMax || ''}
                    onChange={(e) => handleFilterChange('priceMax', e.target.value ? Number(e.target.value) : undefined)}
                    style={{ 
                      padding: '8px 12px', 
                      borderRadius: 6, 
                      border: '1px solid #ddd',
                      width: 120
                    }}
                  />
                  <span style={{ fontSize: 14 }}>원</span>
                </div>
              </div>
            </div>
          )}

          {/* 날짜 범위 필터 */}
          {showDateFilter && (
            <div style={{ display: 'grid', gap: 12 }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>등록 기간</h4>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 14 }}>시작일:</label>
                  <input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
                    style={{ 
                      padding: '8px 12px', 
                      borderRadius: 6, 
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 14 }}>종료일:</label>
                  <input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
                    style={{ 
                      padding: '8px 12px', 
                      borderRadius: 6, 
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 필터 초기화 */}
      {hasActiveFilters && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={clearFilters}
            style={{
              padding: '8px 16px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            모든 필터 초기화
          </button>
        </div>
      )}
    </div>
  );
}
