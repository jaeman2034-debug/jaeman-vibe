import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase'; // ???®Ïùº ÏßÑÏûÖ???¨Ïö©
import { useToast } from '@/components/common/Toast';
import SlotTemplateManager from './SlotTemplateManager';
import type { Facility, FacilitySlot, Reservation, FacilityStats } from '@/types/facility';

interface FacilityManagementDashboardProps {
  facilityId: string;
}

export default function FacilityManagementDashboard({ facilityId }: FacilityManagementDashboardProps) {
  const [facility, setFacility] = useState<Facility | null>(null);
  const [slots, setSlots] = useState<FacilitySlot[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<FacilityStats>({
    totalSlots: 0,
    totalReservations: 0,
    totalRevenue: 0,
    averageRating: 0,
    reviewCount: 0,
    occupancyRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'templates' | 'slots' | 'reservations'>('overview');
  const [dateFilter, setDateFilter] = useState('today');
  const toast = useToast();
  const userId = auth.currentUser?.uid;

  // Load facility data
  useEffect(() => {
    if (facilityId) {
      loadFacilityData();
    }
  }, [facilityId]);

  // Load slots and reservations
  useEffect(() => {
    if (facilityId) {
      loadSlotsAndReservations();
    }
  }, [facilityId, dateFilter]);

  // Calculate stats
  useEffect(() => {
    if (slots.length > 0 || reservations.length > 0) {
      calculateStats();
    }
  }, [slots, reservations]);

  async function loadFacilityData() {
    try {
      const facilityDoc = await getDoc(doc(db, 'facilities', facilityId));
      if (facilityDoc.exists()) {
        setFacility({ id: facilityDoc.id, ...facilityDoc.data() } as Facility);
      }
    } catch (error) {
      console.error('?úÏÑ§ ?ïÎ≥¥ Î°úÎìú ?§Ìå®:', error);
      toast('?úÏÑ§ ?ïÎ≥¥Î•?Î∂àÎü¨?§Îäî???§Ìå®?àÏäµ?àÎã§');
    }
  }

  async function loadSlotsAndReservations() {
    try {
      setLoading(true);
      
      // Get date range based on filter
      const { startDate, endDate } = getDateRange(dateFilter);
      
      // Load slots
      const slotsQuery = query(
        collection(db, 'facility_slots'),
        where('facilityId', '==', facilityId),
        where('startAt', '>=', Timestamp.fromDate(startDate)),
        where('startAt', '<=', Timestamp.fromDate(endDate))
      );
      
      const slotsSnapshot = await getDocs(slotsQuery);
      const slotsData = slotsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FacilitySlot[];
      
      setSlots(slotsData.sort((a, b) => a.startAt.toDate().getTime() - b.startAt.toDate().getTime()));

      // Load reservations
      const reservationsQuery = query(
        collection(db, 'reservations'),
        where('facilityId', '==', facilityId),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate))
      );
      
      const reservationsSnapshot = await getDocs(reservationsQuery);
      const reservationsData = reservationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Reservation[];
      
      setReservations(reservationsData);

    } catch (error) {
      console.error('?¨Î°Ø Î∞??àÏïΩ Î°úÎìú ?§Ìå®:', error);
      toast('?∞Ïù¥?∞Î? Î∂àÎü¨?§Îäî???§Ìå®?àÏäµ?àÎã§');
    } finally {
      setLoading(false);
    }
  }

  function getDateRange(filter: string): { startDate: Date; endDate: Date } {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'today':
        return {
          startDate: startOfDay,
          endDate: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      case 'week':
        const startOfWeek = new Date(startOfDay.getTime() - startOfDay.getDay() * 24 * 60 * 60 * 1000);
        return {
          startDate: startOfWeek,
          endDate: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
        };
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          startDate: startOfMonth,
          endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        };
      default:
        return {
          startDate: startOfDay,
          endDate: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
    }
  }

  function calculateStats() {
    const totalSlots = slots.length;
    const totalReservations = reservations.length;
    const totalRevenue = reservations.reduce((sum, resv) => sum + resv.price, 0);
    
    // Calculate occupancy rate
    const totalCapacity = slots.reduce((sum, slot) => sum + slot.maxCapacity, 0);
    const totalReserved = slots.reduce((sum, slot) => sum + slot.reserved, 0);
    const occupancyRate = totalCapacity > 0 ? (totalReserved / totalCapacity) * 100 : 0;

    setStats({
      totalSlots,
      totalReservations,
      totalRevenue,
      averageRating: 0, // Would need reviews collection
      reviewCount: 0,   // Would need reviews collection
      occupancyRate: Math.round(occupancyRate * 100) / 100
    });
  }

  function getSlotStatusBadge(slot: FacilitySlot) {
    if (slot.status === 'cancelled') {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Ï∑®ÏÜå??/span>;
    }
    
    if (slot.reserved >= slot.maxCapacity) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">ÎßàÍ∞ê</span>;
    }
    
    if (slot.reserved > 0) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">?àÏïΩÏ§?/span>;
    }
    
    return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">?àÏïΩÍ∞Ä??/span>;
  }

  function getReservationStatusBadge(reservation: Reservation) {
    const statusColors = {
      active: 'bg-blue-100 text-blue-800',
      canceled: 'bg-red-100 text-red-800',
      no_show: 'bg-orange-100 text-orange-800',
      attended: 'bg-green-100 text-green-800'
    };
    
    const statusLabels = {
      active: '?àÏïΩÏ§?,
      canceled: 'Ï∑®ÏÜå??,
      no_show: '?∏Ïáº',
      attended: 'Ï∂úÏÑù?ÑÎ£å'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${statusColors[reservation.status]}`}>
        {statusLabels[reservation.status]}
      </span>
    );
  }

  if (!facility) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500">?úÏÑ§ ?ïÎ≥¥Î•?Î∂àÎü¨?????ÜÏäµ?àÎã§</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">{facility.name} Í¥ÄÎ¶?/h1>
        <p className="text-gray-600">{facility.address}</p>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Í∏∞Í∞Ñ:</label>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="today">?§Îäò</option>
          <option value="week">?¥Î≤à Ï£?/option>
          <option value="month">?¥Î≤à ??/option>
        </select>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Í∞úÏöî' },
            { id: 'templates', label: '?úÌîåÎ¶? },
            { id: 'slots', label: '?¨Î°Ø' },
            { id: 'reservations', label: '?àÏïΩ' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalSlots}</div>
                <div className="text-sm text-gray-600">Ï¥??¨Î°Ø</div>
              </div>
              <div className="bg-white border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.totalReservations}</div>
                <div className="text-sm text-gray-600">Ï¥??àÏïΩ</div>
              </div>
              <div className="bg-white border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.totalRevenue.toLocaleString()}??/div>
                <div className="text-sm text-gray-600">Ï¥??òÏùµ</div>
              </div>
              <div className="bg-white border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.occupancyRate}%</div>
                <div className="text-sm text-gray-600">?êÏú†??/div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium mb-4">ÏµúÍ∑º ?úÎèô</h3>
              {loading ? (
                <div className="text-center text-gray-500 py-8">Î°úÎî© Ï§?..</div>
              ) : (
                <div className="space-y-3">
                  {reservations.slice(0, 5).map(reservation => (
                    <div key={reservation.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        {getReservationStatusBadge(reservation)}
                        <span>?àÏïΩ #{reservation.id.slice(0, 8)}</span>
                      </div>
                      <span className="text-gray-500">
                        {reservation.createdAt.toDate().toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  ))}
                  {reservations.length === 0 && (
                    <div className="text-center text-gray-500 py-4">ÏµúÍ∑º ?úÎèô???ÜÏäµ?àÎã§</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <SlotTemplateManager facilityId={facilityId} />
        )}

        {activeTab === 'slots' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">?¨Î°Ø Î™©Î°ù</h3>
              <span className="text-sm text-gray-500">
                Ï¥?{slots.length}Í∞??¨Î°Ø
              </span>
            </div>

            {loading ? (
              <div className="text-center text-gray-500 py-8">Î°úÎî© Ï§?..</div>
            ) : (
              <div className="space-y-3">
                {slots.map(slot => (
                  <div key={slot.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">
                          {slot.startAt.toDate().toLocaleDateString('ko-KR')} {slot.startAt.toDate().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </h4>
                        {getSlotStatusBadge(slot)}
                      </div>
                      <span className="text-sm text-gray-500">
                        {slot.reserved}/{slot.maxCapacity}Î™?
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Ï¢ÖÎ£å:</span> {slot.endAt.toDate().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div>
                        <span className="font-medium">Í∞ÄÍ≤?</span> {slot.price.toLocaleString()}??
                      </div>
                      <div>
                        <span className="font-medium">?îÏó¨:</span> {slot.maxCapacity - slot.reserved}Î™?
                      </div>
                      <div>
                        <span className="font-medium">?êÏú†??</span> {Math.round((slot.reserved / slot.maxCapacity) * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
                
                {slots.length === 0 && (
                  <div className="text-center text-gray-500 py-8">?¥Îãπ Í∏∞Í∞Ñ???¨Î°Ø???ÜÏäµ?àÎã§</div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">?àÏïΩ Î™©Î°ù</h3>
              <span className="text-sm text-gray-500">
                Ï¥?{reservations.length}Í±??àÏïΩ
              </span>
            </div>

            {loading ? (
              <div className="text-center text-gray-500 py-8">Î°úÎî© Ï§?..</div>
            ) : (
              <div className="space-y-3">
                {reservations.map(reservation => (
                  <div key={reservation.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">?àÏïΩ #{reservation.id.slice(0, 8)}</h4>
                        {getReservationStatusBadge(reservation)}
                      </div>
                      <span className="text-sm text-gray-500">
                        {reservation.createdAt.toDate().toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">?¨Î°Ø ID:</span> {reservation.slotId.slice(0, 8)}
                      </div>
                      <div>
                        <span className="font-medium">?¨Ïö©??</span> {reservation.userId.slice(0, 8)}
                      </div>
                      <div>
                        <span className="font-medium">Í∞ÄÍ≤?</span> {reservation.price.toLocaleString()}??
                      </div>
                      <div>
                        <span className="font-medium">Í≤∞Ï†ú:</span> {reservation.paymentStatus}
                      </div>
                    </div>
                  </div>
                ))}
                
                {reservations.length === 0 && (
                  <div className="text-center text-gray-500 py-8">?¥Îãπ Í∏∞Í∞Ñ???àÏïΩ???ÜÏäµ?àÎã§</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
