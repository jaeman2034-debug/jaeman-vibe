import React from 'react';
import { Link } from 'react-router-dom';

const sampleFacilities = [
  { id: 1, name: '축구장A', slots: 8, available: 3 },
  { id: 2, name: '축구장B', slots: 6, available: 1 },
  { id: 3, name: '실내 축구장', slots: 4, available: 0 }
];

const sampleClubs = [
  { id: 1, name: 'FC 서울', members: 25, level: '중급' },
  { id: 2, name: '축구 동호회', members: 18, level: '초급' },
  { id: 3, name: '프로 연습팀', members: 30, level: '고급' }
];

const sampleJobs = [
  { id: 1, title: '축구 코치 모집', type: 'part-time', location: '서울' },
  { id: 2, title: '축구장 관리자', type: 'full-time', location: '경기' },
  { id: 3, title: '유소년 축구 지도자', type: 'contract', location: '인천' }
];

const sampleEvents = [
  { id: 1, title: '주말 축구 대회', date: '2024-01-15', participants: 16 },
  { id: 2, title: '축구 클리닉', date: '2024-01-20', participants: 8 },
  { id: 3, title: '친선 경기', date: '2024-01-25', participants: 22 }
];

export default function SoccerCategoryPreview() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">축구 카테고리</h1>
              <p className="mt-2 text-gray-600">축구 관련 모든 것을 한 곳에서</p>
            </div>
            <Link 
              to="/app/market?category=football" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              축구 상품 보기
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 시설 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">축구 시설</h2>
              <Link to="/facilities?category=football" className="text-blue-600 hover:text-blue-700 text-sm">
                전체 보기
              </Link>
            </div>
            <div className="space-y-3">
              {sampleFacilities.map((facility) => (
                <div key={facility.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{facility.name}</h3>
                    <p className="text-sm text-gray-600">
                      {facility.available}/{facility.slots} 슬롯 사용 가능
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      facility.available > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {facility.available > 0 ? '예약 가능' : '예약 불가'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 클럽 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">축구 클럽</h2>
              <Link to="/groups?category=football" className="text-blue-600 hover:text-blue-700 text-sm">
                전체 보기
              </Link>
            </div>
            <div className="space-y-3">
              {sampleClubs.map((club) => (
                <div key={club.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{club.name}</h3>
                    <p className="text-sm text-gray-600">
                      멤버 {club.members}명 • {club.level}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      모집중
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 채용 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">축구 채용</h2>
              <Link to="/jobs?category=football" className="text-blue-600 hover:text-blue-700 text-sm">
                전체 보기
              </Link>
            </div>
            <div className="space-y-3">
              {sampleJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{job.title}</h3>
                    <p className="text-sm text-gray-600">
                      {job.type} • {job.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      모집중
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 이벤트 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">축구 이벤트</h2>
              <Link to="/events?category=football" className="text-blue-600 hover:text-blue-700 text-sm">
                전체 보기
              </Link>
            </div>
            <div className="space-y-3">
              {sampleEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{event.title}</h3>
                    <p className="text-sm text-gray-600">
                      {event.date} • 참가자 {event.participants}명
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      참가 가능
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* CTA 섹션 */}
        <div className="mt-12 bg-blue-600 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            축구 커뮤니티에 참여하세요
          </h2>
          <p className="text-blue-100 mb-6">
            다양한 축구 관련 상품, 클럽, 채용 정보를 확인하고 참여해보세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/app/market?category=football" 
              className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              상품 둘러보기
            </Link>
            <Link 
              to="/groups?category=football" 
              className="bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors font-medium"
            >
              클럽 참여하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}