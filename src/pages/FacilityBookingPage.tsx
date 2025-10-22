import React, { useState } from 'react';
import { auth } from '@/lib/firebase'; // ???¨ì¼ ì§„ì…???¬ìš©
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

  // Demo facility data (?¤ì œë¡œëŠ” ?°ì´?°ë² ?´ìŠ¤?ì„œ ë¡œë“œ)
  const demoFacilities = [
    { id: 'demo-facility-1', name: 'ì¶•êµ¬??A', category: 'soccer' },
    { id: 'demo-facility-2', name: '?Œë‹ˆ?¤ì¥ B', category: 'tennis' },
    { id: 'demo-facility-3', name: '?êµ¬??C', category: 'basketball' }
  ];

  const handleFacilityChange = (newFacilityId: string) => {
    setFacilityId(newFacilityId);
    toast(`${demoFacilities.find(f => f.id === newFacilityId)?.name}?¼ë¡œ ë³€ê²½ë˜?ˆìŠµ?ˆë‹¤`);
  };

  const handleDateFilterChange = (newFilter: 'today' | 'week' | 'month') => {
    setDateFilter(newFilter);
    toast(`ê¸°ê°„??${newFilter === 'today' ? '?¤ëŠ˜' : newFilter === 'week' ? '?´ë²ˆ ì£? : '?´ë²ˆ ??}?¼ë¡œ ë³€ê²½ë˜?ˆìŠµ?ˆë‹¤`);
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-center mb-4">?œì„¤ ?ˆì•½ ?œìŠ¤??/h1>
          <p className="text-gray-600 text-center mb-6">
            ?œì„¤ ?¬ë¡¯???ˆì•½?˜ë ¤ë©?ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??
          </p>
          <div className="text-center">
            <button
              onClick={() => auth.signInAnonymously()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ?µëª… ë¡œê·¸?¸ìœ¼ë¡?ì²´í—˜?˜ê¸°
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
              <h1 className="text-xl font-semibold text-gray-900">Yago Vibe ?œì„¤ ?ˆì•½</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Facility Selector */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">?œì„¤:</label>
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
                <label className="text-sm font-medium text-gray-700">ê¸°ê°„:</label>
                <select
                  value={dateFilter}
                  onChange={(e) => handleDateFilterChange(e.target.value as any)}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="today">?¤ëŠ˜</option>
                  <option value="week">?´ë²ˆ ì£?/option>
                  <option value="month">?´ë²ˆ ??/option>
                </select>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">?ˆë…•?˜ì„¸??</span>
                <button
                  onClick={() => auth.signOut()}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ë¡œê·¸?„ì›ƒ
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
              { id: 'slots', label: '?¬ë¡¯ ?ˆì•½', description: '?¬ìš© ê°€?¥í•œ ?¬ë¡¯???•ì¸?˜ê³  ?ˆì•½?˜ì„¸?? },
              { id: 'my-reservations', label: '???ˆì•½', description: '???ˆì•½ ?´ì—­ê³?ì²´í¬?? },
              { id: 'management', label: '?œì„¤ ê´€ë¦?, description: '?œì„¤ ?Œìœ ?ë? ?„í•œ ê´€ë¦??„êµ¬' },
              { id: 'admin', label: 'ê´€ë¦¬ì ?µê³„', description: '?´ì˜ ?µê³„ ë°?? ë¢°??ë¶„ì„' }
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
              <h2 className="text-2xl font-bold mb-4">?œì„¤ ?¬ë¡¯ ?ˆì•½</h2>
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
              <h2 className="text-2xl font-bold mb-4">???ˆì•½ ê´€ë¦?/h2>
              <MyReservationsWithCheckIn />
            </div>
          </div>
        )}

        {activeTab === 'management' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">?œì„¤ ê´€ë¦?/h2>
              <FacilityManagementDashboard facilityId={facilityId} />
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">?´ì˜ ?µê³„</h2>
              <AdminStatsDashboard />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Yago Vibe ?œì„¤ ?ˆì•½ ?œìŠ¤??/h3>
            <p className="text-gray-300 text-sm">
              ? ë¢°??ê¸°ë°˜ ?ˆì•½ ?œìŠ¤?œìœ¼ë¡??ˆì „?˜ê³  ?¸ë¦¬???œì„¤ ?´ìš©???œê³µ?©ë‹ˆ??
            </p>
            <div className="mt-4 text-xs text-gray-400">
              <p>??? ë¢°???ìˆ˜???°ë¥¸ ?ˆì•½ ?œí•œ ë°??œíƒ</p>
              <p>??ë°˜ë³µ ?œí”Œë¦¿ì„ ?µí•œ ?¨ìœ¨?ì¸ ?¬ë¡¯ ê´€ë¦?/p>
              <p>???¤ì‹œê°?ì²´í¬??ë°??¸ì‡¼ ?ë™ ì²˜ë¦¬</p>
              <p>???¸ëœ??…˜ ê¸°ë°˜ ?ˆì „???ˆì•½ ?œìŠ¤??/p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
