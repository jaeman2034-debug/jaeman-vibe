import { doc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { UserTrustStats, TrustPolicy, BookingRequest, BookingResponse } from '@/types/facility';
import { DEFAULT_TRUST_POLICY } from '@/types/facility';
import { db } from '@/lib/firebase';

const functions = getFunctions();

export interface TrustCheckResult {
  passed: boolean;
  score: number;
  grade: string;
  restrictions: string[];
  canBook: boolean;
  requiresPrepayment: boolean;
  dailyLimit?: number;
  currentDailyCount?: number;
}

export interface DailyReservationCount {
  userId: string;
  date: string;
  count: number;
}

/**
 * ?¬ìš©?ì˜ ? ë¢°???•ì±…???•ì¸?˜ê³  ?ˆì•½ ê°€???¬ë?ë¥??ë‹¨
 */
export async function checkTrustPolicyBeforeReserve(
  userId: string,
  policy: TrustPolicy = DEFAULT_TRUST_POLICY
): Promise<TrustCheckResult> {
  try {
    // 1. ?¬ìš©??? ë¢°???•ë³´ ì¡°íšŒ
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('?¬ìš©???•ë³´ë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤');
    }

    const userData = userDoc.data();
    const userStats = userData.stats as UserTrustStats;

    if (!userStats) {
      throw new Error('?¬ìš©??? ë¢°???•ë³´ê°€ ?†ìŠµ?ˆë‹¤');
    }

    const { trustScore, trustGrade } = userStats;
    const restrictions: string[] = [];
    let passed = true;

    // 2. ìµœì†Œ ?ˆì•½ ê°€???ìˆ˜ ?•ì¸
    if (trustScore < policy.minScoreForBooking) {
      restrictions.push(`? ë¢°??${policy.minScoreForBooking}???´ìƒ ?„ìš” (?„ì¬: ${trustScore}??`);
      passed = false;
    }

    // 3. ?¬ì „ ê²°ì œ ?„ìš” ?¬ë? ?•ì¸
    const requiresPrepayment = trustScore < policy.minScoreForNoPrepayment;
    if (requiresPrepayment) {
      restrictions.push('?¬ì „ ê²°ì œê°€ ?„ìš”?©ë‹ˆ??);
    }

    // 4. ?¼ì¼ ?ˆì•½ ?œí•œ ?•ì¸
    let dailyLimit: number | undefined;
    if (trustScore < policy.minScoreForUnlimited) {
      dailyLimit = policy.dailyLimitForLowTrust;
      restrictions.push(`?˜ë£¨ ${dailyLimit}ê±??œí•œ`);
    }

    // 5. ?¤ëŠ˜ ?ˆì•½???Ÿìˆ˜ ?•ì¸
    let currentDailyCount = 0;
    if (dailyLimit) {
      currentDailyCount = await getDailyReservationCount(userId);
      
      if (currentDailyCount >= dailyLimit) {
        restrictions.push(`?¤ëŠ˜ ?ˆì•½ ?œë„ë¥?ì´ˆê³¼?ˆìŠµ?ˆë‹¤ (${currentDailyCount}/${dailyLimit})`);
        passed = false;
      }
    }

    // 6. ?ˆì•½ ê°€???¬ë? ?ë‹¨
    const canBook = passed && (dailyLimit ? currentDailyCount < dailyLimit : true);

    return {
      passed,
      score: trustScore,
      grade: trustGrade,
      restrictions,
      canBook,
      requiresPrepayment,
      dailyLimit,
      currentDailyCount
    };

  } catch (error) {
    console.error('? ë¢°???•ì±… ?•ì¸ ?¤íŒ¨:', error);
    throw error;
  }
}

/**
 * ?¬ìš©?ì˜ ?¤ëŠ˜ ?ˆì•½ ?Ÿìˆ˜ë¥?ì¡°íšŒ
 */
export async function getDailyReservationCount(userId: string): Promise<number> {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

    const reservationsQuery = query(
      collection(db, 'reservations'),
      where('userId', '==', userId),
      where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
      where('createdAt', '<=', Timestamp.fromDate(endOfDay)),
      where('status', 'in', ['active', 'attended']) // ì·¨ì†Œ???ˆì•½?€ ?œì™¸
    );

    const snapshot = await getDocs(reservationsQuery);
    return snapshot.size;

  } catch (error) {
    console.error('?¼ì¼ ?ˆì•½ ?Ÿìˆ˜ ì¡°íšŒ ?¤íŒ¨:', error);
    return 0;
  }
}

/**
 * ?ˆì•½ ?”ì²­??ì²˜ë¦¬?˜ê³  ? ë¢°???•ì±…???ìš©
 */
export async function processBookingRequest(
  request: BookingRequest,
  policy: TrustPolicy = DEFAULT_TRUST_POLICY
): Promise<BookingResponse> {
  try {
    // 1. ? ë¢°???•ì±… ?•ì¸
    const trustCheck = await checkTrustPolicyBeforeReserve(request.userId, policy);
    
    if (!trustCheck.canBook) {
      return {
        success: false,
        error: '? ë¢°???•ì±…??ë§Œì¡±?˜ì? ?ŠìŠµ?ˆë‹¤',
        trustCheck: {
          passed: false,
          score: trustCheck.score,
          grade: trustCheck.grade,
          restrictions: trustCheck.restrictions
        }
      };
    }

    // 2. ?¬ë¡¯ ê°€?©ì„± ?•ì¸
    const slotDoc = await getDoc(doc(db, 'facility_slots', request.slotId));
    if (!slotDoc.exists()) {
      return {
        success: false,
        error: '?¬ë¡¯??ì°¾ì„ ???†ìŠµ?ˆë‹¤'
      };
    }

    const slot = slotDoc.data();
    if (slot.reserved >= slot.maxCapacity) {
      return {
        success: false,
        error: '?´ë? ?ˆì•½??ë§ˆê°?˜ì—ˆ?µë‹ˆ??
      };
    }

    // 3. ?œê°„ ?œí•œ ?•ì¸ (?œì‘ 2?œê°„ ?„ê¹Œì§€)
    const now = new Date();
    const slotStart = slot.startAt.toDate();
    const bookingDeadline = new Date(slotStart.getTime() - 2 * 60 * 60 * 1000);
    
    if (now > bookingDeadline) {
      return {
        success: false,
        error: '?ˆì•½ ë§ˆê° ?œê°„??ì§€?¬ìŠµ?ˆë‹¤ (?œì‘ 2?œê°„ ?„ê¹Œì§€)'
      };
    }

    // 4. ê²°ì œ ?„ìš” ?¬ë? ?•ì¸
    const paymentRequired = trustCheck.requiresPrepayment;
    
    if (paymentRequired) {
      // ê²°ì œê°€ ?„ìš”??ê²½ìš° ê²°ì œ URL ?ì„± (?¤ì œë¡œëŠ” ê²°ì œ ?œìŠ¤???°ë™)
      return {
        success: false,
        paymentRequired: true,
        paymentUrl: `/payment?slotId=${request.slotId}&amount=${request.price}`,
        error: '?¬ì „ ê²°ì œê°€ ?„ìš”?©ë‹ˆ??,
        trustCheck: {
          passed: true,
          score: trustCheck.score,
          grade: trustCheck.grade,
          restrictions: trustCheck.restrictions
        }
      };
    }

    // 5. ?ˆì•½ ?ì„± (ê²°ì œê°€ ?„ìš” ?†ëŠ” ê²½ìš°)
    const reservationRef = doc(collection(db, 'reservations'));
    const reservationData = {
      id: reservationRef.id,
      facilityId: request.facilityId,
      slotId: request.slotId,
      userId: request.userId,
      status: 'active',
      price: request.price,
      paymentStatus: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await reservationRef.set(reservationData);

    // 6. ?¬ë¡¯ ?ˆì•½ ?¸ì› ???…ë°?´íŠ¸
    await slotDoc.ref.update({
      reserved: slot.reserved + 1,
      updatedAt: Timestamp.now()
    });

    return {
      success: true,
      reservationId: reservationRef.id,
      trustCheck: {
        passed: true,
        score: trustCheck.score,
        grade: trustCheck.grade,
        restrictions: trustCheck.restrictions
      }
    };

  } catch (error: any) {
    console.error('?ˆì•½ ì²˜ë¦¬ ?¤íŒ¨:', error);
    return {
      success: false,
      error: error.message || '?ˆì•½ ì²˜ë¦¬ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤'
    };
  }
}

/**
 * ?¬ìš©?ì˜ ? ë¢°???ìˆ˜ë¥??…ë°?´íŠ¸ (?ˆì•½ ?„ë£Œ/ì·¨ì†Œ/?¸ì‡¼ ??
 */
export async function updateUserTrustScore(
  userId: string,
  action: 'reservation_completed' | 'reservation_canceled' | 'no_show',
  policy: TrustPolicy = DEFAULT_TRUST_POLICY
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Note: FieldValue.increment is not available in client-side Firestore
    // This function should be called from Cloud Functions or use a different approach
    console.log(`?¬ìš©??${userId} ? ë¢°???ìˆ˜ ?…ë°?´íŠ¸ ?”ì²­: ${action}`);
    console.log('ì°¸ê³ : ? ë¢°???ìˆ˜??Cloud Function?ì„œ ?ë™?¼ë¡œ ê³„ì‚°?©ë‹ˆ??);

  } catch (error) {
    console.error('? ë¢°???ìˆ˜ ?…ë°?´íŠ¸ ?¤íŒ¨:', error);
    throw error;
  }
}

/**
 * ? ë¢°???•ì±…???™ì ?¼ë¡œ ?…ë°?´íŠ¸
 */
export async function updateTrustPolicy(
  facilityId: string,
  newPolicy: Partial<TrustPolicy>
): Promise<void> {
  try {
    const policyRef = doc(db, 'trust_policies', facilityId);
    await policyRef.set({
      ...DEFAULT_TRUST_POLICY,
      ...newPolicy,
      updatedAt: Timestamp.now()
    }, { merge: true });

    console.log(`?œì„¤ ${facilityId} ? ë¢°???•ì±… ?…ë°?´íŠ¸ ?„ë£Œ`);
  } catch (error) {
    console.error('? ë¢°???•ì±… ?…ë°?´íŠ¸ ?¤íŒ¨:', error);
    throw error;
  }
}

/**
 * ?œì„¤ë³?? ë¢°???•ì±…??ì¡°íšŒ
 */
export async function getTrustPolicy(facilityId: string): Promise<TrustPolicy> {
  try {
    const policyDoc = await getDoc(doc(db, 'trust_policies', facilityId));
    
    if (policyDoc.exists()) {
      return { ...DEFAULT_TRUST_POLICY, ...policyDoc.data() } as TrustPolicy;
    }
    
    return DEFAULT_TRUST_POLICY;
  } catch (error) {
    console.error('? ë¢°???•ì±… ì¡°íšŒ ?¤íŒ¨:', error);
    return DEFAULT_TRUST_POLICY;
  }
}

/**
 * ? ë¢°???•ì±… ?„ë°˜ ???Œë¦¼ ?„ì†¡
 */
export async function sendTrustPolicyViolationNotification(
  userId: string,
  violation: string,
  restrictions: string[]
): Promise<void> {
  try {
    // FCM ?Œë¦¼ ?„ì†¡ (?¤ì œë¡œëŠ” Cloud Function?ì„œ ì²˜ë¦¬)
    const sendNotificationFn = httpsCallable(functions, 'sendTrustPolicyViolationNotification');
    await sendNotificationFn({
      userId,
      violation,
      restrictions
    });

    console.log(`?¬ìš©??${userId}?ê²Œ ? ë¢°???•ì±… ?„ë°˜ ?Œë¦¼ ?„ì†¡ ?„ë£Œ`);
  } catch (error) {
    console.error('? ë¢°???•ì±… ?„ë°˜ ?Œë¦¼ ?„ì†¡ ?¤íŒ¨:', error);
  }
}
