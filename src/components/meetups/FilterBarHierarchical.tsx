import React from 'react';
import { MeetupsQuery, Sport, Branch, Leaf } from '@/types/meetups';
import { SPORTS, SPORT_LABEL, BRANCHES, BRANCH_LABEL, TAXONOMY, getLeavesForSportAndBranch } from '@/constants/taxonomy';
import { X, Filter } from 'lucide-react';

interface FilterBarHierarchicalProps {
  q: MeetupsQuery;
  onChange: (q: MeetupsQuery) => void;
}

export function FilterBarHierarchical({ q, onChange }: FilterBarHierarchicalProps) {
  const [showMobileFilter, setShowMobileFilter] = React.useState(false);

  // 현재 선택된 종목과 가지에 따른 소가지 목록
  const currentSport = q.sport || 'soccer';
  const currentBranch = q.branch || 'all';
  const leaves = getLeavesForSportAndBranch(currentSport as Sport, currentBranch as Branch);

  const activeFiltersCount = Object.values(q).filter(value => 
    value !== undefined && value !== null && value !== '' && value !== 'all'
  ).length;

  const handleSportChange = (sport: Sport | 'all') => {
    onChange({ 
      ...q, 
      sport: sport as Sport, 
      branch: 'all', 
      leaf: 'all' 
    });
  };

  const handleBranchChange = (branch: Branch | 'all') => {
    onChange({ 
      ...q, 
      branch: branch as Branch, 
      leaf: 'all' 
    });
  };

  const handleLeafChange = (leaf: Leaf | 'all') => {
    onChange({ 
      ...q, 
      leaf: leaf as Leaf 
    });
  };

  const handleSearchChange = (search: string) => {
    onChange({ ...q, search });
  };

  const handleSortChange = (sortBy: 'recommended' | 'time' | 'popularity') => {
    onChange({ ...q, sortBy });
  };

  const clearAllFilters = () => {
    onChange({
      sport: 'all',
      branch: 'all',
      leaf: 'all',
      search: '',
      sortBy: 'recommended'
    });
  };

  return (
    <>
      {/* Desktop Filter Bar */}
      <div className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">계층형 필터</span>
              {activeFiltersCount > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                필터 초기화
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* 3단계 계층형 필터 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1단: 종목 */}
              <div>
                <label className="text-xs text-zinc-500 ml-2">종목</label>
                <select 
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border"
                  value={q.sport || 'all'}
                  onChange={(e) => handleSportChange(e.target.value as Sport | 'all')}
                >
                  <option value="all">전체</option>
                  {SPORTS.map(sport => (
                    <option key={sport} value={sport}>
                      {SPORT_LABEL[sport]}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2단: 가지 */}
              <div>
                <label className="text-xs text-zinc-500 ml-2">가지</label>
                <select 
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border"
                  value={q.branch || 'all'}
                  onChange={(e) => handleBranchChange(e.target.value as Branch | 'all')}
                >
                  {BRANCHES.map(branch => (
                    <option key={branch} value={branch}>
                      {branch === 'all' ? '전체' : BRANCH_LABEL[branch]}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3단: 소가지 */}
              <div>
                <label className="text-xs text-zinc-500 ml-2">소가지</label>
                <select 
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border"
                  value={q.leaf || 'all'}
                  onChange={(e) => handleLeafChange(e.target.value as Leaf | 'all')}
                >
                  <option value="all">전체</option>
                  {leaves.map(leaf => (
                    <option key={leaf} value={leaf}>
                      {leaf}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 정렬/검색 */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-xs text-zinc-500 ml-2">검색</label>
                <input 
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border"
                  placeholder="검색(제목/설명)" 
                  value={q.search || ''}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 ml-2">정렬</label>
                <select 
                  className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border"
                  value={q.sortBy || 'recommended'}
                  onChange={(e) => handleSortChange(e.target.value as 'recommended' | 'time' | 'popularity')}
                >
                  <option value="recommended">추천순</option>
                  <option value="time">시간순</option>
                  <option value="popularity">인기순</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Button */}
      <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <button
            onClick={() => setShowMobileFilter(true)}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium"
          >
            <Filter className="w-5 h-5" />
            계층형 필터
            {activeFiltersCount > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {showMobileFilter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
          <div className="bg-white h-full overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">계층형 필터</h3>
              <button
                onClick={() => setShowMobileFilter(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 space-y-6">
              {/* Mobile filter content */}
              <div className="space-y-4">
                {/* 1단: 종목 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">종목</label>
                  <select 
                    className="w-full px-3 py-2 rounded-lg bg-white border"
                    value={q.sport || 'all'}
                    onChange={(e) => handleSportChange(e.target.value as Sport | 'all')}
                  >
                    <option value="all">전체</option>
                    {SPORTS.map(sport => (
                      <option key={sport} value={sport}>
                        {SPORT_LABEL[sport]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2단: 가지 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">가지</label>
                  <select 
                    className="w-full px-3 py-2 rounded-lg bg-white border"
                    value={q.branch || 'all'}
                    onChange={(e) => handleBranchChange(e.target.value as Branch | 'all')}
                  >
                    {BRANCHES.map(branch => (
                      <option key={branch} value={branch}>
                        {branch === 'all' ? '전체' : BRANCH_LABEL[branch]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3단: 소가지 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">소가지</label>
                  <select 
                    className="w-full px-3 py-2 rounded-lg bg-white border"
                    value={q.leaf || 'all'}
                    onChange={(e) => handleLeafChange(e.target.value as Leaf | 'all')}
                  >
                    <option value="all">전체</option>
                    {leaves.map(leaf => (
                      <option key={leaf} value={leaf}>
                        {leaf}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 검색 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
                  <input 
                    className="w-full px-3 py-2 rounded-lg bg-white border"
                    placeholder="검색(제목/설명)" 
                    value={q.search || ''}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>

                {/* 정렬 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">정렬</label>
                  <select 
                    className="w-full px-3 py-2 rounded-lg bg-white border"
                    value={q.sortBy || 'recommended'}
                    onChange={(e) => handleSortChange(e.target.value as 'recommended' | 'time' | 'popularity')}
                  >
                    <option value="recommended">추천순</option>
                    <option value="time">시간순</option>
                    <option value="popularity">인기순</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
              <div className="flex gap-3">
                <button
                  onClick={clearAllFilters}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium"
                >
                  초기화
                </button>
                <button
                  onClick={() => setShowMobileFilter(false)}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium"
                >
                  적용
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
