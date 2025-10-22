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
 * ?�용?�의 ?�뢰???�책???�인?�고 ?�약 가???��?�??�단
 */
export async function checkTrustPolicyBeforeReserve(
  userId: string,
  policy: TrustPolicy = DEFAULT_TRUST_POLICY
): Promise<TrustCheckResult> {
  try {
    // 1. ?�용???�뢰???�보 조회
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('?�용???�보�?찾을 ???�습?�다');
    }

    const userData = userDoc.data();
    const userStats = userData.stats as UserTrustStats;

    if (!userStats) {
      throw new Error('?�용???�뢰???�보가 ?�습?�다');
    }

    const { trustScore, trustGrade } = userStats;
    const restrictions: string[] = [];
    let passed = true;

    // 2. 최소 ?�약 가???�수 ?�인
    if (trustScore < policy.minScoreForBooking) {
      restrictions.push(`?�뢰??${policy.minScoreForBooking}???�상 ?�요 (?�재: ${trustScore}??`);
      passed = false;
    }

    // 3. ?�전 결제 ?�요 ?��? ?�인
    const requiresPrepayment = trustScore < policy.minScoreForNoPrepayment;
    if (requiresPrepayment) {
      restrictions.push('?�전 결제가 ?�요?�니??);
    }

    // 4. ?�일 ?�약 ?�한 ?�인
    let dailyLimit: number | undefined;
    if (trustScore < policy.minScoreForUnlimited) {
      dailyLimit = policy.dailyLimitForLowTrust;
      restrictions.push(`?�루 ${dailyLimit}�??�한`);
    }

    // 5. ?�늘 ?�약???�수 ?�인
    let currentDailyCount = 0;
    if (dailyLimit) {
      currentDailyCount = await getDailyReservationCount(userId);
      
      if (currentDailyCount >= dailyLimit) {
        restrictions.push(`?�늘 ?�약 ?�도�?초과?�습?�다 (${currentDailyCount}/${dailyLimit})`);
        passed = false;
      }
    }

    // 6. ?�약 가???��? ?�단
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
    console.error('?�뢰???�책 ?�인 ?�패:', error);
    throw error;
  }
}

/**
 * ?�용?�의 ?�늘 ?�약 ?�수�?조회
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
      where('status', 'in', ['active', 'attended']) // 취소???�약?� ?�외
    );

    const snapshot = await getDocs(reservationsQuery);
    return snapshot.size;

  } catch (error) {
    console.error('?�일 ?�약 ?�수 조회 ?�패:', error);
    return 0;
  }
}

/**
 * ?�약 ?�청??처리?�고 ?�뢰???�책???�용
 */
export async function processBookingRequest(
  request: BookingRequest,
  policy: TrustPolicy = DEFAULT_TRUST_POLICY
): Promise<BookingResponse> {
  try {
    // 1. ?�뢰???�책 ?�인
    const trustCheck = await checkTrustPolicyBeforeReserve(request.userId, policy);
    
    if (!trustCheck.canBook) {
      return {
        success: false,
        error: '?�뢰???�책??만족?��? ?�습?�다',
        trustCheck: {
          passed: false,
          score: trustCheck.score,
          grade: trustCheck.grade,
          restrictions: trustCheck.restrictions
        }
      };
    }

    // 2. ?�롯 가?�성 ?�인
    const slotDoc = await getDoc(doc(db, 'facility_slots', request.slotId));
    if (!slotDoc.exists()) {
      return {
        success: false,
        error: '?�롯??찾을 ???�습?�다'
      };
    }

    const slot = slotDoc.data();
    if (slot.reserved >= slot.maxCapacity) {
      return {
        success: false,
        error: '?��? ?�약??마감?�었?�니??
      };
    }

    // 3. ?�간 ?�한 ?�인 (?�작 2?�간 ?�까지)
    const now = new Date();
    const slotStart = slot.startAt.toDate();
    const bookingDeadline = new Date(slotStart.getTime() - 2 * 60 * 60 * 1000);
    
    if (now > bookingDeadline) {
      return {
        success: false,
        error: '?�약 마감 ?�간??지?�습?�다 (?�작 2?�간 ?�까지)'
      };
    }

    // 4. 결제 ?�요 ?��? ?�인
    const paymentRequired = trustCheck.requiresPrepayment;
    
    if (paymentRequired) {
      // 결제가 ?�요??경우 결제 URL ?�성 (?�제로는 결제 ?�스???�동)
      return {
        success: false,
        paymentRequired: true,
        paymentUrl: `/payment?slotId=${request.slotId}&amount=${request.price}`,
        error: '?�전 결제가 ?�요?�니??,
        trustCheck: {
          passed: true,
          score: trustCheck.score,
          grade: trustCheck.grade,
          restrictions: trustCheck.restrictions
        }
      };
    }

    // 5. ?�약 ?�성 (결제가 ?�요 ?�는 경우)
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

    // 6. ?�롯 ?�약 ?�원 ???�데?�트
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
    console.error('?�약 처리 ?�패:', error);
    return {
      success: false,
      error: error.message || '?�약 처리 �??�류가 발생?�습?�다'
    };
  }
}

/**
 * ?�용?�의 ?�뢰???�수�??�데?�트 (?�약 ?�료/취소/?�쇼 ??
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
    console.log(`?�용??${userId} ?�뢰???�수 ?�데?�트 ?�청: ${action}`);
    console.log('참고: ?�뢰???�수??Cloud Function?�서 ?�동?�로 계산?�니??);

  } catch (error) {
    console.error('?�뢰???�수 ?�데?�트 ?�패:', error);
    throw error;
  }
}

/**
 * ?�뢰???�책???�적?�로 ?�데?�트
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

    console.log(`?�설 ${facilityId} ?�뢰???�책 ?�데?�트 ?�료`);
  } catch (error) {
    console.error('?�뢰???�책 ?�데?�트 ?�패:', error);
    throw error;
  }
}

/**
 * ?�설�??�뢰???�책??조회
 */
export async function getTrustPolicy(facilityId: string): Promise<TrustPolicy> {
  try {
    const policyDoc = await getDoc(doc(db, 'trust_policies', facilityId));
    
    if (policyDoc.exists()) {
      return { ...DEFAULT_TRUST_POLICY, ...policyDoc.data() } as TrustPolicy;
    }
    
    return DEFAULT_TRUST_POLICY;
  } catch (error) {
    console.error('?�뢰???�책 조회 ?�패:', error);
    return DEFAULT_TRUST_POLICY;
  }
}

/**
 * ?�뢰???�책 ?�반 ???�림 ?�송
 */
export async function sendTrustPolicyViolationNotification(
  userId: string,
  violation: string,
  restrictions: string[]
): Promise<void> {
  try {
    // FCM ?�림 ?�송 (?�제로는 Cloud Function?�서 처리)
    const sendNotificationFn = httpsCallable(functions, 'sendTrustPolicyViolationNotification');
    await sendNotificationFn({
      userId,
      violation,
      restrictions
    });

    console.log(`?�용??${userId}?�게 ?�뢰???�책 ?�반 ?�림 ?�송 ?�료`);
  } catch (error) {
    console.error('?�뢰???�책 ?�반 ?�림 ?�송 ?�패:', error);
  }
}
