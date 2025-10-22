import React from 'react';
import { MeetupFilter } from '@/types/meetups';
import { X, Filter } from 'lucide-react';

interface FilterBarProps {
  filter: MeetupFilter;
  onFilterChange: (filter: Partial<MeetupFilter>) => void;
  onClearFilter: () => void;
}

const SPORTS = [
  { value: 'soccer', label: '축구/풋살' },
  { value: 'basketball', label: '농구' },
  { value: 'tennis', label: '테니스' },
  { value: 'badminton', label: '배드민턴' },
  { value: 'volleyball', label: '배구' },
  { value: 'baseball', label: '야구' },
  { value: 'swimming', label: '수영' },
  { value: 'running', label: '러닝' },
  { value: 'cycling', label: '사이클링' },
  { value: 'climbing', label: '클라이밍' },
  { value: 'golf', label: '골프' },
  { value: 'etc', label: '기타' }
];

const REGIONS = [
  { value: '의정부/송산2동', label: '송산2동' },
  { value: '의정부/의정부동', label: '의정부동' },
  { value: '의정부/장암동', label: '장암동' },
  { value: '의정부/신곡동', label: '신곡동' },
  { value: '의정부/금오동', label: '금오동' },
  { value: '의정부/가능동', label: '가능동' },
  { value: '의정부/녹양동', label: '녹양동' },
  { value: '의정부/호원동', label: '호원동' }
];

const PRICE_RANGES = [
  { value: { min: 0, max: 0 }, label: '무료' },
  { value: { min: 0, max: 5000 }, label: '5천원 이하' },
  { value: { min: 5000, max: 10000 }, label: '5천원 - 1만원' },
  { value: { min: 10000, max: 20000 }, label: '1만원 - 2만원' },
  { value: { min: 20000, max: 50000 }, label: '2만원 - 5만원' },
  { value: { min: 50000, max: 999999 }, label: '5만원 이상' }
];

export function FilterBar({ filter, onFilterChange, onClearFilter }: FilterBarProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showMobileFilter, setShowMobileFilter] = React.useState(false);

  const activeFiltersCount = Object.values(filter).filter(value => 
    value !== undefined && value !== null && value !== ''
  ).length;

  const handleSportChange = (sport: string) => {
    onFilterChange({ sport: sport === filter.sport ? undefined : sport });
  };

  const handleRegionChange = (region: string) => {
    onFilterChange({ region: region === filter.region ? undefined : region });
  };

  const handlePriceRangeChange = (priceRange: { min: number; max: number }) => {
    onFilterChange({ 
      priceRange: priceRange.min === filter.priceRange?.min ? undefined : priceRange 
    });
  };

  const handleDateChange = (date: string) => {
    onFilterChange({ date: date === filter.date ? undefined : date });
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getWeekendDate = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilSaturday = (6 - dayOfWeek) % 7;
    const saturday = new Date(today);
    saturday.setDate(today.getDate() + daysUntilSaturday);
    return saturday.toISOString().split('T')[0];
  };

  return (
    <>
      {/* Desktop Filter Bar */}
      <div className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">필터</span>
              {activeFiltersCount > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={onClearFilter}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                필터 초기화
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* Sports */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">스포츠 종목</label>
              <div className="flex flex-wrap gap-2">
                {SPORTS.map((sport) => (
                  <button
                    key={sport.value}
                    onClick={() => handleSportChange(sport.value)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filter.sport === sport.value
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {sport.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Regions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">지역</label>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map((region) => (
                  <button
                    key={region.value}
                    onClick={() => handleRegionChange(region.value)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filter.region === region.value
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {region.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">가격대</label>
              <div className="flex flex-wrap gap-2">
                {PRICE_RANGES.map((range, index) => (
                  <button
                    key={index}
                    onClick={() => handlePriceRangeChange(range.value)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filter.priceRange?.min === range.value.min && filter.priceRange?.max === range.value.max
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">날짜</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleDateChange(getTodayDate())}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filter.date === getTodayDate()
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  오늘
                </button>
                <button
                  onClick={() => handleDateChange(getTomorrowDate())}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filter.date === getTomorrowDate()
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  내일
                </button>
                <button
                  onClick={() => handleDateChange(getWeekendDate())}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filter.date === getWeekendDate()
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  이번 주말
                </button>
                <button
                  onClick={() => handleDateChange('')}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filter.date === ''
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  전체
                </button>
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
            필터
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
              <h3 className="text-lg font-semibold">필터</h3>
              <button
                onClick={() => setShowMobileFilter(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 space-y-6">
              {/* Mobile filter content - same as desktop but in modal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">스포츠 종목</label>
                <div className="grid grid-cols-2 gap-2">
                  {SPORTS.map((sport) => (
                    <button
                      key={sport.value}
                      onClick={() => handleSportChange(sport.value)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        filter.sport === sport.value
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {sport.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">지역</label>
                <div className="grid grid-cols-2 gap-2">
                  {REGIONS.map((region) => (
                    <button
                      key={region.value}
                      onClick={() => handleRegionChange(region.value)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        filter.region === region.value
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {region.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">가격대</label>
                <div className="space-y-2">
                  {PRICE_RANGES.map((range, index) => (
                    <button
                      key={index}
                      onClick={() => handlePriceRangeChange(range.value)}
                      className={`w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                        filter.priceRange?.min === range.value.min && filter.priceRange?.max === range.value.max
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">날짜</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDateChange(getTodayDate())}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      filter.date === getTodayDate()
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    오늘
                  </button>
                  <button
                    onClick={() => handleDateChange(getTomorrowDate())}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      filter.date === getTomorrowDate()
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    내일
                  </button>
                  <button
                    onClick={() => handleDateChange(getWeekendDate())}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      filter.date === getWeekendDate()
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    이번 주말
                  </button>
                  <button
                    onClick={() => handleDateChange('')}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      filter.date === ''
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    전체
                  </button>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
              <div className="flex gap-3">
                <button
                  onClick={onClearFilter}
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
