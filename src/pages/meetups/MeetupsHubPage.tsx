import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeetupsFeedHierarchical } from '@/hooks/useMeetupsFeed';
import { MeetupCard } from '@/components/meetups/MeetupCard';
import { MeetupMapView } from '@/components/meetups/MeetupMapView';
import { HeroQuickFunnel } from '@/components/meetups/HeroQuickFunnel';
import { FilterBarHierarchical } from '@/components/meetups/FilterBarHierarchical';
import { Plus, Search, Loader2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';

export default function MeetupsHubPage() {
  const navigate = useNavigate();
  const { meetups, loading, error, query, updateQuery, clearQuery } = useMeetupsFeedHierarchical();
  const [view, setView] = useState<'grid'|'map'>('grid');

  const handleCreateMeetup = () => {
    navigate('/meetups/new');
  };

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log('Search clicked');
  };

  const handleFilter = () => {
    // Mobile filter is handled by FilterBar component
    console.log('Filter clicked');
  };

  const handleMeetupClick = (meetupId: string) => {
    navigate(`/meetups/${meetupId}`);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <HeroQuickFunnel
        onCreateMeetup={handleCreateMeetup}
        onSearch={handleSearch}
        onFilter={handleFilter}
      />

      {/* Filter Bar - 계층형 필터 사용 */}
      <FilterBarHierarchical
        q={query}
        onChange={updateQuery}
      />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              모임 목록
            </h2>
            <p className="text-gray-600 mt-1">
              {loading ? '로딩 중...' : `${meetups.length}개의 모임이 있습니다`}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
              검색
            </button>
            <button
              onClick={handleCreateMeetup}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              모임 만들기
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">모임을 불러오는 중...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-medium">오류가 발생했습니다</p>
            <p className="text-red-600 mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* View Toggle */}
        <div className="flex items-center justify-end -mt-2 mb-4">
          <div className="text-xs flex items-center gap-1">
            <button 
              aria-label="카드 보기" 
              onClick={() => setView('grid')}
              className={`px-2 py-1 rounded-lg ${view === 'grid' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}
            >
              카드
            </button>
            <button 
              aria-label="지도 보기" 
              onClick={() => setView('map')}
              className={`px-2 py-1 rounded-lg ${view === 'map' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}
            >
              지도
            </button>
          </div>
        </div>

        {/* Meetups Grid/Map */}
        {!loading && !error && (
          <>
            {meetups.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  모임이 없습니다
                </h3>
                <p className="text-gray-600 mb-6">
                  {Object.values(query).some(value => value && value !== 'all' && value !== '') 
                    ? '선택한 필터에 맞는 모임이 없습니다. 필터를 조정해보세요.'
                    : '아직 등록된 모임이 없습니다. 첫 번째 모임을 만들어보세요!'
                  }
                </p>
                {Object.values(query).some(value => value && value !== 'all' && value !== '') ? (
                  <button
                    onClick={clearQuery}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    필터 초기화
                  </button>
                ) : (
                  <button
                    onClick={handleCreateMeetup}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    모임 만들기
                  </button>
                )}
              </div>
            ) : view === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meetups.map((meetup) => (
                  <MeetupCard
                    key={meetup.id}
                    meetup={meetup}
                    onClick={() => handleMeetupClick(meetup.id)}
                  />
                ))}
              </div>
            ) : (
              <MeetupMapView 
                items={meetups} 
                onSelect={(id) => handleMeetupClick(id)} 
              />
            )}
          </>
        )}

        {/* Load More Button (for future pagination) */}
        {!loading && !error && meetups.length > 0 && (
          <div className="text-center mt-8">
            <button className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              더 많은 모임 보기
            </button>
          </div>
        )}
      </div>
      </div>
    </AppLayout>
  );
}
