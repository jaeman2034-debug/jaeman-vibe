import React, { useState } from 'react';
import { auth } from '@/lib/firebase'; // ???�일 진입???�용
import { useToast } from '@/components/common/Toast';
import FacilitySlotList from '@/components/facility/FacilitySlotList';
import FacilityManagementDashboard from '@/components/facility/FacilityManagementDashboard';
import MyReservationsWithCheckIn from '@/components/reservations/MyReservationsWithCheckIn';
import AdminStatsDashboard from '@/components/admin/AdminStatsDashboard';

export default function FacilityBookingPage() {
  const [activeTab, setActiveTab] = useState<'slots' | 'my-reservations' | 'management' | 'admin'>('slots');
  const [facilityId, setFacilityId] = useState('demo-facility-1');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month'>('week');
  const toast = useToast();
  const userId = auth.currentUser?.uid;

  // Demo facility data (?�제로는 ?�이?�베?�스?�서 로드)
  const demoFacilities = [
    { id: 'demo-facility-1', name: '축구??A', category: 'soccer' },
    { id: 'demo-facility-2', name: '?�니?�장 B', category: 'tennis' },
    { id: 'demo-facility-3', name: '?�구??C', category: 'basketball' }
  ];

  const handleFacilityChange = (newFacilityId: string) => {
    setFacilityId(newFacilityId);
    toast(`${demoFacilities.find(f => f.id === newFacilityId)?.name}?�로 변경되?�습?�다`);
  };

  const handleDateFilterChange = (newFilter: 'today' | 'week' | 'month') => {
    setDateFilter(newFilter);
    toast(`기간??${newFilter === 'today' ? '?�늘' : newFilter === 'week' ? '?�번 �? : '?�번 ??}?�로 변경되?�습?�다`);
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-center mb-4">?�설 ?�약 ?�스??/h1>
          <p className="text-gray-600 text-center mb-6">
            ?�설 ?�롯???�약?�려�?로그?�이 ?�요?�니??
          </p>
          <div className="text-center">
            <button
              onClick={() => auth.signInAnonymously()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ?�명 로그?�으�?체험?�기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Yago Vibe ?�설 ?�약</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Facility Selector */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">?�설:</label>
                <select
                  value={facilityId}
                  onChange={(e) => handleFacilityChange(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  {demoFacilities.map(facility => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">기간:</label>
                <select
                  value={dateFilter}
                  onChange={(e) => handleDateFilterChange(e.target.value as any)}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="today">?�늘</option>
                  <option value="week">?�번 �?/option>
                  <option value="month">?�번 ??/option>
                </select>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">?�녕?�세??</span>
                <button
                  onClick={() => auth.signOut()}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  로그?�웃
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'slots', label: '?�롯 ?�약', description: '?�용 가?�한 ?�롯???�인?�고 ?�약?�세?? },
              { id: 'my-reservations', label: '???�약', description: '???�약 ?�역�?체크?? },
              { id: 'management', label: '?�설 관�?, description: '?�설 ?�유?��? ?�한 관�??�구' },
              { id: 'admin', label: '관리자 ?�계', description: '?�영 ?�계 �??�뢰??분석' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div>{tab.label}</div>
                  <div className="text-xs font-normal mt-1 max-w-24">
                    {tab.description}
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'slots' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">?�설 ?�롯 ?�약</h2>
              <FacilitySlotList 
                facilityId={facilityId} 
                dateFilter={dateFilter}
                showBooked={false}
              />
            </div>
          </div>
        )}

        {activeTab === 'my-reservations' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">???�약 관�?/h2>
              <MyReservationsWithCheckIn />
            </div>
          </div>
        )}

        {activeTab === 'management' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">?�설 관�?/h2>
              <FacilityManagementDashboard facilityId={facilityId} />
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">?�영 ?�계</h2>
              <AdminStatsDashboard />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Yago Vibe ?�설 ?�약 ?�스??/h3>
            <p className="text-gray-300 text-sm">
              ?�뢰??기반 ?�약 ?�스?�으�??�전?�고 ?�리???�설 ?�용???�공?�니??
            </p>
            <div className="mt-4 text-xs text-gray-400">
              <p>???�뢰???�수???�른 ?�약 ?�한 �??�택</p>
              <p>??반복 ?�플릿을 ?�한 ?�율?�인 ?�롯 관�?/p>
              <p>???�시�?체크??�??�쇼 ?�동 처리</p>
              <p>???�랜??�� 기반 ?�전???�약 ?�스??/p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
