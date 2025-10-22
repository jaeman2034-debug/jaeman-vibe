import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, addDoc, Timestamp, runTransaction } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, auth } from '@/lib/firebase'; // ???¨ì¼ ì§„ì…???¬ìš©
import { useToast } from '@/components/common/Toast';
import type { FacilitySlot, Facility, UserTrustStats, TrustPolicy } from '@/types/facility';
import { TRUST_GRADES, DEFAULT_TRUST_POLICY } from '@/types/facility';

const functions = getFunctions();

interface SlotBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotId: string;
  facilityId: string;
}

export default function SlotBookingModal({ isOpen, onClose, slotId, facilityId }: SlotBookingModalProps) {
  const [slot, setSlot] = useState<FacilitySlot | null>(null);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [userTrust, setUserTrust] = useState<UserTrustStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [trustCheck, setTrustCheck] = useState<{
    passed: boolean;
    score: number;
    grade: string;
    restrictions: string[];
  } | null>(null);
  const toast = useToast();
  const userId = auth.currentUser?.uid;

  // Load slot and facility data
  useEffect(() => {
    if (isOpen && slotId && facilityId) {
      loadSlotData();
    }
  }, [isOpen, slotId, facilityId]);

  // Load user trust data
  useEffect(() => {
    if (userId) {
      loadUserTrust();
    }
  }, [userId]);

  async function loadSlotData() {
    try {
      setLoading(true);
      
      // Load slot data
      const slotDoc = await getDoc(doc(db, 'facility_slots', slotId));
      if (!slotDoc.exists()) {
        toast('?¬ë¡¯??ì°¾ì„ ???†ìŠµ?ˆë‹¤');
        onClose();
        return;
      }
      setSlot({ id: slotDoc.id, ...slotDoc.data() } as FacilitySlot);

      // Load facility data
      const facilityDoc = await getDoc(doc(db, 'facilities', facilityId));
      if (facilityDoc.exists()) {
        setFacility({ id: facilityDoc.id, ...facilityDoc.data() } as Facility);
      }
    } catch (error) {
      console.error('?¬ë¡¯ ?°ì´??ë¡œë“œ ?¤íŒ¨:', error);
      toast('?¬ë¡¯ ?•ë³´ë¥?ë¶ˆëŸ¬?¤ëŠ”???¤íŒ¨?ˆìŠµ?ˆë‹¤');
    } finally {
      setLoading(false);
    }
  }

  async function loadUserTrust() {
    try {
      if (!userId) return;
      
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.stats) {
          setUserTrust(userData.stats as UserTrustStats);
        }
      }
    } catch (error) {
      console.error('?¬ìš©??? ë¢°??ë¡œë“œ ?¤íŒ¨:', error);
    }
  }

  // Check trust policy before booking
  function checkTrustPolicy(): boolean {
    if (!userTrust) return false;

    const restrictions: string[] = [];
    let passed = true;

    // Check minimum score for booking
    if (userTrust.trustScore < DEFAULT_TRUST_POLICY.minScoreForBooking) {
      restrictions.push(`? ë¢°??${DEFAULT_TRUST_POLICY.minScoreForBooking}???´ìƒ ?„ìš”`);
      passed = false;
    }

    // Check if prepayment is required
    if (userTrust.trustScore < DEFAULT_TRUST_POLICY.minScoreForNoPrepayment) {
      restrictions.push('?¬ì „ ê²°ì œê°€ ?„ìš”?©ë‹ˆ??);
    }

    // Check daily limit for low trust users
    if (userTrust.trustScore < DEFAULT_TRUST_POLICY.minScoreForUnlimited) {
      restrictions.push(`?˜ë£¨ ${DEFAULT_TRUST_POLICY.dailyLimitForLowTrust}ê±??œí•œ`);
    }

    setTrustCheck({
      passed,
      score: userTrust.trustScore,
      grade: userTrust.trustGrade,
      restrictions
    });

    return passed;
  }

  // Handle booking
  async function handleBooking() {
    if (!userId || !slot || !facility) return;

    try {
      setBooking(true);

      // Check trust policy
      if (!checkTrustPolicy()) {
        toast('? ë¢°???•ì±…??ë§Œì¡±?˜ì? ?ŠìŠµ?ˆë‹¤');
        return;
      }

      // Check if slot is still available
      if (slot.reserved >= slot.maxCapacity) {
        toast('?´ë? ?ˆì•½??ë§ˆê°?˜ì—ˆ?µë‹ˆ??);
        return;
      }

      // Check server time validation
      const now = new Date();
      const slotStart = slot.startAt.toDate();
      const bookingDeadline = new Date(slotStart.getTime() - 2 * 60 * 60 * 1000); // 2?œê°„ ?„ê¹Œì§€

      if (now > bookingDeadline) {
        toast('?ˆì•½ ë§ˆê° ?œê°„??ì§€?¬ìŠµ?ˆë‹¤ (?œì‘ 2?œê°„ ?„ê¹Œì§€)');
        return;
      }

      // Create reservation with transaction
      await runTransaction(db, async (transaction) => {
        // Re-check slot availability
        const slotRef = doc(db, 'facility_slots', slotId);
        const slotSnap = await transaction.get(slotRef);
        
        if (!slotSnap.exists()) {
          throw new Error('?¬ë¡¯??ì°¾ì„ ???†ìŠµ?ˆë‹¤');
        }

        const currentSlot = slotSnap.data() as FacilitySlot;
        if (currentSlot.reserved >= currentSlot.maxCapacity) {
          throw new Error('?´ë? ?ˆì•½??ë§ˆê°?˜ì—ˆ?µë‹ˆ??);
        }

        // Create reservation
        const reservationRef = doc(collection(db, 'reservations'));
        const reservationData = {
          id: reservationRef.id,
          facilityId,
          slotId,
          userId,
          status: 'active',
          price: slot.price,
          paymentStatus: 'pending',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        transaction.set(reservationRef, reservationData);

        // Update slot reserved count
        transaction.update(slotRef, {
          reserved: currentSlot.reserved + 1,
          updatedAt: Timestamp.now()
        });
      });

      toast('?ˆì•½???„ë£Œ?˜ì—ˆ?µë‹ˆ??');
      onClose();

      // Refresh slot data
      loadSlotData();

    } catch (error: any) {
      console.error('?ˆì•½ ?¤íŒ¨:', error);
      toast(`?ˆì•½ ?¤íŒ¨: ${error.message || '?????†ëŠ” ?¤ë¥˜'}`);
    } finally {
      setBooking(false);
    }
  }

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center text-gray-500">ë¡œë”© ì¤?..</div>
        </div>
      </div>
    );
  }

  if (!slot || !facility) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center text-red-500">?¬ë¡¯ ?•ë³´ë¥?ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤</div>
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            ?«ê¸°
          </button>
        </div>
      </div>
    );
  }

  const isAvailable = slot.reserved < slot.maxCapacity;
  const remainingSpots = slot.maxCapacity - slot.reserved;
  const slotStart = slot.startAt.toDate();
  const slotEnd = slot.endAt.toDate();
  const now = new Date();
  const isPastDeadline = now > new Date(slotStart.getTime() - 2 * 60 * 60 * 1000);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">?¬ë¡¯ ?ˆì•½</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            Ã—
          </button>
        </div>

        {/* Facility Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900">{facility.name}</h3>
          <p className="text-sm text-gray-600">{facility.address}</p>
        </div>

        {/* Slot Info */}
        <div className="mb-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">? ì§œ:</span>
            <span className="font-medium">{slotStart.toLocaleDateString('ko-KR')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">?œê°„:</span>
            <span className="font-medium">
              {slotStart.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} ~ 
              {slotEnd.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">ê°€ê²?</span>
            <span className="font-medium text-blue-600">{slot.price.toLocaleString()}??/span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">?”ì—¬ ?¸ì›:</span>
            <span className={`font-medium ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
              {remainingSpots}ëª?
            </span>
          </div>
        </div>

        {/* Trust Policy Check */}
        {userTrust && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800">? ë¢°???ìˆ˜</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                TRUST_GRADES[userTrust.trustGrade as keyof typeof TRUST_GRADES]?.bg || 'bg-gray-100'
              } ${
                TRUST_GRADES[userTrust.trustGrade as keyof typeof TRUST_GRADES]?.color || 'text-gray-800'
              }`}>
                {userTrust.trustGrade} ({userTrust.trustScore}??
              </span>
            </div>
            
            {trustCheck && trustCheck.restrictions.length > 0 && (
              <div className="text-xs text-blue-700">
                <div className="font-medium mb-1">?œí•œ?¬í•­:</div>
                <ul className="space-y-1">
                  {trustCheck.restrictions.map((restriction, index) => (
                    <li key={index}>??{restriction}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Booking Status */}
        {!isAvailable && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800 text-sm">???¬ë¡¯?€ ?´ë? ?ˆì•½??ë§ˆê°?˜ì—ˆ?µë‹ˆ??/div>
          </div>
        )}

        {isPastDeadline && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-yellow-800 text-sm">?ˆì•½ ë§ˆê° ?œê°„??ì§€?¬ìŠµ?ˆë‹¤ (?œì‘ 2?œê°„ ?„ê¹Œì§€)</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            ì·¨ì†Œ
          </button>
          
          <button
            onClick={handleBooking}
            disabled={!isAvailable || isPastDeadline || !trustCheck?.passed || booking}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {booking ? '?ˆì•½ ì¤?..' : '?ˆì•½?˜ê¸°'}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-4 text-xs text-gray-500">
          <div>???ˆì•½?€ ?œì‘ 2?œê°„ ?„ê¹Œì§€ ê°€?¥í•©?ˆë‹¤</div>
          <div>??? ë¢°?„ì— ?°ë¼ ?ˆì•½ ?œí•œ???ˆì„ ???ˆìŠµ?ˆë‹¤</div>
          <div>???ˆì•½ ì·¨ì†Œ???œì‘ 30ë¶??„ê¹Œì§€ ê°€?¥í•©?ˆë‹¤</div>
        </div>
      </div>
    </div>
  );
}
