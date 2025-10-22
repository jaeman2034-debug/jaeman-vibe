import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase'; // ???¨ì¼ ì§„ì…???¬ìš©
import { useToast } from '@/components/common/Toast';
import SlotBookingModal from './SlotBookingModal';
import type { FacilitySlot, Facility } from '@/types/facility';
import { TRUST_GRADES } from '@/types/facility';

interface FacilitySlotListProps {
  facilityId: string;
  dateFilter?: 'today' | 'week' | 'month';
  showBooked?: boolean;
}

export default function FacilitySlotList({ 
  facilityId, 
  dateFilter = 'week',
  showBooked = false 
}: FacilitySlotListProps) {
  const [slots, setSlots] = useState<FacilitySlot[]>([]);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<FacilitySlot | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [userTrust, setUserTrust] = useState<{ score: number; grade: string } | null>(null);
  const toast = useToast();
  const userId = auth.currentUser?.uid;

  // Load slots and facility data
  useEffect(() => {
    if (facilityId) {
      loadSlots();
      loadFacility();
      if (userId) {
        loadUserTrust();
      }
    }
  }, [facilityId, dateFilter, userId]);

  async function loadSlots() {
    try {
      setLoading(true);
      
      const { startDate, endDate } = getDateRange(dateFilter);
      
      const slotsQuery = query(
        collection(db, 'facility_slots'),
        where('facilityId', '==', facilityId),
        where('startAt', '>=', Timestamp.fromDate(startDate)),
        where('startAt', '<=', Timestamp.fromDate(endDate)),
        orderBy('startAt', 'asc')
      );
      
      const snapshot = await getDocs(slotsQuery);
      let slotsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FacilitySlot[];
      
      // Filter out fully booked slots if not showing booked
      if (!showBooked) {
        slotsData = slotsData.filter(slot => slot.reserved < slot.maxCapacity);
      }
      
      setSlots(slotsData);
    } catch (error) {
      console.error('?¬ë¡¯ ë¡œë“œ ?¤íŒ¨:', error);
      toast('?¬ë¡¯ ?•ë³´ë¥?ë¶ˆëŸ¬?¤ëŠ”???¤íŒ¨?ˆìŠµ?ˆë‹¤');
    } finally {
      setLoading(false);
    }
  }

  async function loadFacility() {
    try {
      const facilityDoc = await getDocs(query(
        collection(db, 'facilities'),
        where('__name__', '==', facilityId)
      ));
      
      if (!facilityDoc.empty) {
        setFacility({ id: facilityDoc.docs[0].id, ...facilityDoc.docs[0].data() } as Facility);
      }
    } catch (error) {
      console.error('?œì„¤ ?•ë³´ ë¡œë“œ ?¤íŒ¨:', error);
    }
  }

  async function loadUserTrust() {
    try {
      if (!userId) return;
      
      const userDoc = await getDocs(query(
        collection(db, 'users'),
        where('__name__', '==', userId)
      ));
      
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        if (userData.stats) {
          setUserTrust({
            score: userData.stats.trustScore || 0,
            grade: userData.stats.trustGrade || 'F'
          });
        }
      }
    } catch (error) {
      console.error('?¬ìš©??? ë¢°??ë¡œë“œ ?¤íŒ¨:', error);
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

  function handleSlotClick(slot: FacilitySlot) {
    if (!userId) {
      toast('ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??);
      return;
    }
    
    setSelectedSlot(slot);
    setShowBookingModal(true);
  }

  function getSlotStatusBadge(slot: FacilitySlot) {
    if (slot.status === 'cancelled') {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">ì·¨ì†Œ??/span>;
    }
    
    if (slot.reserved >= slot.maxCapacity) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">ë§ˆê°</span>;
    }
    
    if (slot.reserved > 0) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">?ˆì•½ì¤?/span>;
    }
    
    return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">?ˆì•½ê°€??/span>;
  }

  function getSlotAvailabilityColor(slot: FacilitySlot) {
    const ratio = slot.reserved / slot.maxCapacity;
    
    if (ratio >= 0.8) return 'text-red-600';
    if (ratio >= 0.5) return 'text-yellow-600';
    return 'text-green-600';
  }

  function formatTimeRange(slot: FacilitySlot) {
    const start = slot.startAt.toDate();
    const end = slot.endAt.toDate();
    
    return `${start.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} ~ ${end.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
  }

  function formatDate(slot: FacilitySlot) {
    const date = slot.startAt.toDate();
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    if (date.toDateString() === today.toDateString()) {
      return '?¤ëŠ˜';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return '?´ì¼';
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center text-gray-500 py-8">?¬ë¡¯??ë¶ˆëŸ¬?¤ëŠ” ì¤?..</div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        {showBooked ? '?´ë‹¹ ê¸°ê°„???±ë¡???¬ë¡¯???†ìŠµ?ˆë‹¤' : '?ˆì•½ ê°€?¥í•œ ?¬ë¡¯???†ìŠµ?ˆë‹¤'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">?ˆì•½ ê°€?¥í•œ ?¬ë¡¯</h3>
          {facility && (
            <p className="text-sm text-gray-600">{facility.name}</p>
          )}
        </div>
        
        {userTrust && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">??? ë¢°??</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              TRUST_GRADES[userTrust.grade as keyof typeof TRUST_GRADES]?.bg || 'bg-gray-100'
            } ${
              TRUST_GRADES[userTrust.grade as keyof typeof TRUST_GRADES]?.color || 'text-gray-800'
            }`}>
              {userTrust.grade} ({userTrust.score}??
            </span>
          </div>
        )}
      </div>

      {/* Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {slots.map(slot => {
          const isAvailable = slot.reserved < slot.maxCapacity;
          const remainingSpots = slot.maxCapacity - slot.reserved;
          const occupancyRate = Math.round((slot.reserved / slot.maxCapacity) * 100);
          
          return (
            <div
              key={slot.id}
              onClick={() => handleSlotClick(slot)}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                isAvailable ? 'hover:border-blue-300' : 'opacity-75 cursor-not-allowed'
              }`}
            >
              {/* Date and Time */}
              <div className="mb-3">
                <div className="font-medium text-gray-900">{formatDate(slot)}</div>
                <div className="text-sm text-gray-600">{formatTimeRange(slot)}</div>
              </div>

              {/* Status and Availability */}
              <div className="flex items-center justify-between mb-3">
                {getSlotStatusBadge(slot)}
                <span className={`text-sm font-medium ${getSlotAvailabilityColor(slot)}`}>
                  {remainingSpots}/{slot.maxCapacity}ëª?
                </span>
              </div>

              {/* Price */}
              <div className="mb-3">
                <span className="text-lg font-bold text-blue-600">
                  {slot.price.toLocaleString()}??
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>?ìœ ??/span>
                  <span>{occupancyRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      occupancyRate >= 80 ? 'bg-red-500' :
                      occupancyRate >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${occupancyRate}%` }}
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                disabled={!isAvailable}
                className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  isAvailable
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isAvailable ? '?ˆì•½?˜ê¸°' : 'ë§ˆê°??}
              </button>
            </div>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm text-blue-800">
          <div className="font-medium mb-2">?’¡ ?ˆì•½ ?ˆë‚´</div>
          <ul className="space-y-1">
            <li>???ˆì•½?€ ?œì‘ 2?œê°„ ?„ê¹Œì§€ ê°€?¥í•©?ˆë‹¤</li>
            <li>??? ë¢°?„ì— ?°ë¼ ?ˆì•½ ?œí•œ???ˆì„ ???ˆìŠµ?ˆë‹¤</li>
            <li>???ˆì•½ ì·¨ì†Œ???œì‘ 30ë¶??„ê¹Œì§€ ê°€?¥í•©?ˆë‹¤</li>
            <li>??ì²´í¬?¸ì? ?œì‘ 10ë¶??„ë???ì¢…ë£Œ 15ë¶??„ê¹Œì§€ ê°€?¥í•©?ˆë‹¤</li>
          </ul>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedSlot && (
        <SlotBookingModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedSlot(null);
          }}
          slotId={selectedSlot.id}
          facilityId={facilityId}
        />
      )}
    </div>
  );
}
