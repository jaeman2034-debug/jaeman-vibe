import { 
  doc, 
  collection, 
  runTransaction, 
  Timestamp, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  increment
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, auth } from "@/lib/firebase"; // 단일 진입점 사용
import type { 
  CreateReservationRequest, 
  ReservationResponse, 
  SlotStatus, 
  FacilitySlot,
  SlotTemplate,
  MLSlotRecommendation,
  MLRecommendationRequest,
  BookingValidationResult,
  UserTrustStats,
  TrustPolicy,
  Subscription,
  Coupon,
  CouponUsage,
  PriceCalculation,
  CouponStats,
  SubscriptionStats
} from "@/types/facility";
import { DEFAULT_TRUST_POLICY } from "@/types/facility";

const functions = getFunctions();

export class FacilityReservationService {
  
  // Enhanced slot status check with time validation
  static async checkSlotStatus(slotId: string): Promise<SlotStatus> {
    try {
      const slotRef = doc(db, "facility_slots", slotId);
      const slotDoc = await getDoc(slotRef);
      
      if (!slotDoc.exists()) {
        return {
          isAvailable: false,
          remainingCapacity: 0,
          canBook: false,
          reason: "슬롯을 찾을 수 없습니다."
        };
      }

      const slot = slotDoc.data() as FacilitySlot;
      const now = new Date();
      const startTime = slot.startAt instanceof Timestamp ? slot.startAt.toDate() : new Date(slot.startAt);
      
      // 과거 슬롯 체크
      if (startTime < now) {
        return {
          isAvailable: false,
          remainingCapacity: 0,
          canBook: false,
          reason: "이미 지난 시간입니다."
        };
      }

      // 시작 5분까지만 예약 가능
      const allowUntil = new Date(startTime.getTime() - 5 * 60 * 1000);
      const timeUntilStart = Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60));
      const isLastMinute = timeUntilStart <= 60;

      if (now > allowUntil) {
        return {
          isAvailable: false,
          remainingCapacity: 0,
          canBook: false,
          reason: "예약 마감되었습니다.",
          timeUntilStart: 0
        };
      }

      const remainingCapacity = Math.max(0, slot.maxCapacity - slot.reserved);
      const canBook = slot.status === "available" && remainingCapacity > 0;

      return {
        isAvailable: slot.status === "available",
        remainingCapacity,
        canBook,
        reason: canBook ? undefined : "예약이 불가능합니다.",
        timeUntilStart,
        isLastMinute
      };
    } catch (error) {
      console.error("슬롯 상태 확인 실패:", error);
      return {
        isAvailable: false,
        remainingCapacity: 0,
        canBook: false,
        reason: "상태 확인에 실패했습니다."
      };
    }
  }

  // Enhanced booking validation with trust policy
  static async validateBooking(
    userId: string, 
    slotId: string, 
    facilityId: string
  ): Promise<BookingValidationResult> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // 1. Trust policy check
      const trustCheck = await this.checkUserTrustPolicy(userId);
      if (trustCheck.restrictions.length > 0) {
        errors.push(...trustCheck.restrictions);
      }

      // 2. Slot availability check
      const slotStatus = await this.checkSlotStatus(slotId);
      if (!slotStatus.canBook) {
        errors.push(slotStatus.reason || "슬롯 예약이 불가능합니다.");
      }

      // 3. Daily booking limit check
      const dailyBookings = await this.getUserDailyBookings(userId, facilityId);
      const trustPolicy = await this.getTrustPolicy(facilityId);
      
      if (trustCheck.score < trustPolicy.minScoreForUnlimited && 
          dailyBookings >= trustPolicy.dailyLimitForLowTrust) {
        errors.push(`하루 최대 ${trustPolicy.dailyLimitForLowTrust}건만 예약 가능합니다.`);
      }

      // 4. Advance booking check
      const slotRef = doc(db, "facility_slots", slotId);
      const slotSnap = await slotRef.get();
      if (slotSnap.exists()) {
        const slot = slotSnap.data() as FacilitySlot;
        const startTime = slot.startAt instanceof Timestamp ? slot.startAt.toDate() : new Date(slot.startAt);
        const daysUntilStart = Math.floor((startTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilStart > trustPolicy.maxAdvanceBookingDays) {
          errors.push(`${trustPolicy.maxAdvanceBookingDays}일 후 슬롯만 예약 가능합니다.`);
        }
      }

      // 5. Warnings for low trust users
      if (trustCheck.score < 50) {
        warnings.push("신뢰도가 낮아 선전 결제가 필요할 수 있습니다.");
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        trustCheck,
        slotAvailability: {
          remainingCapacity: slotStatus.remainingCapacity,
          timeUntilStart: slotStatus.timeUntilStart || 0
        }
      };
    } catch (error) {
      console.error("예약 검증 실패:", error);
      return {
        isValid: false,
        errors: ["예약 검증에 실패했습니다."],
        warnings: []
      };
    }
  }

  // Enhanced reservation creation with validation
  static async createReservation(request: CreateReservationRequest): Promise<ReservationResponse> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { ok: false, error: "로그인이 필요합니다." };
      }

      const { facilityId, slotId } = request;
      if (!facilityId || !slotId) {
        return { ok: false, error: "필수 정보가 누락되었습니다." };
      }

      // Pre-validation
      const validation = await this.validateBooking(user.uid, slotId, facilityId);
      if (!validation.isValid) {
        return { ok: false, error: validation.errors[0] };
      }

      const slotRef = doc(db, "facility_slots", slotId);
      const resvCol = collection(db, "reservations");

      // Server timestamp for consistency
      const serverNow = Timestamp.now();

      const result = await runTransaction(db, async (tx) => {
        // Re-check slot availability in transaction
        const slotSnap = await tx.get(slotRef);
        if (!slotSnap.exists()) {
          throw new Error("SLOT_NOT_FOUND");
        }

        const slot = slotSnap.data() as FacilitySlot;
        
        if (slot.status !== "available") {
          throw new Error("SLOT_CLOSED");
        }

        if ((slot.reserved || 0) >= slot.maxCapacity) {
          throw new Error("SOLD_OUT");
        }

        // Time validation in transaction
        const startTime = slot.startAt instanceof Timestamp ? slot.startAt.toDate() : new Date(slot.startAt);
        const allowUntil = new Date(startTime.getTime() - 5 * 60 * 1000);
        const now = serverNow.toDate();
        
        if (now > allowUntil) {
          throw new Error("TOO_LATE");
        }

        // Duplicate reservation check - get all matching reservations
        const dupSnap = await getDocs(
          query(
          resvCol,
          where("slotId", "==", slotId),
          where("userId", "==", user.uid),
          where("status", "==", "active"),
          limit(1)
          )
        );
        if (!dupSnap.empty) {
          throw new Error("ALREADY_RESERVED");
        }

        // Update slot
        tx.update(slotRef, {
          reserved: (slot.reserved || 0) + 1,
          updatedAt: serverNow,
        });

        // Create reservation
        const newResvRef = doc(resvCol);
        tx.set(newResvRef, {
          id: newResvRef.id,
          facilityId,
          slotId,
          userId: user.uid,
          price: request.price,
          status: "active",
          paymentStatus: "pending",
          createdAt: serverNow,
          updatedAt: serverNow,
          notes: request.notes
        });

        return newResvRef.id;
      });

      // Update user trust stats
      await this.updateUserTrustStats(user.uid, "booking");

      return { ok: true, reservationId: result };
    } catch (error: any) {
      console.error("예약 생성 실패:", error);
      
      let errorMessage = "예약에 실패했습니다.";
      if (error.message === "SLOT_NOT_FOUND") errorMessage = "슬롯을 찾을 수 없습니다.";
      else if (error.message === "SLOT_CLOSED") errorMessage = "예약이 마감되었습니다.";
      else if (error.message === "SOLD_OUT") errorMessage = "예약이 마감되었습니다.";
      else if (error.message === "TOO_LATE") errorMessage = "예약 마감 시간이 지났습니다.";
      else if (error.message === "ALREADY_RESERVED") errorMessage = "이미 예약된 슬롯입니다.";

      return { ok: false, error: errorMessage };
    }
  }

  // ML-based slot recommendations
  static async getMLRecommendedSlots(request: MLRecommendationRequest): Promise<MLSlotRecommendation[]> {
    try {
      const recommendFn = httpsCallable(functions, 'recommendSlotsFn');
      const result = await recommendFn(request);
      
      if (result.data && Array.isArray(result.data)) {
        return result.data as MLSlotRecommendation[];
      }
      
      return [];
    } catch (error) {
      console.error("ML 추천 실패, 폴백 규칙 사용:", error);
      return await this.getFallbackRecommendedSlots(request);
    }
  }

  // Fallback recommendation system when ML is unavailable
  private static async getFallbackRecommendedSlots(request: MLRecommendationRequest): Promise<MLSlotRecommendation[]> {
    try {
      const { facilityId, dateRange, preferences } = request;
      const now = new Date();
      
      // Get available slots for the date range
      const slotsQuery = query(
        collection(db, "facility_slots"),
        where("facilityId", "==", facilityId),
        where("status", "==", "available"),
        where("startAt", ">=", Timestamp.fromDate(now)),
        orderBy("startAt", "asc"),
        limit(20)
      );

      const snapshot = await getDocs(slotsQuery);
      const slots = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FacilitySlot[];

      // Simple scoring based on popularity, time convenience, and price
      const recommendations: MLSlotRecommendation[] = slots.map(slot => {
        const startTime = slot.startAt instanceof Timestamp ? slot.startAt.toDate() : new Date(slot.startAt);
        const timeDiff = Math.abs(startTime.getTime() - now.getTime());
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        // Time convenience score (closer to now = higher score)
        const timeConvenience = Math.max(0, 100 - hoursDiff * 10);
        
        // Popularity score (based on remaining capacity)
        const popularity = (slot.maxCapacity - slot.reserved) / slot.maxCapacity * 100;
        
        // Price value score (lower price = higher score, assuming reasonable range)
        const priceValue = Math.max(0, 100 - (slot.price / 10000) * 20);
        
        // User preference score (if time preferences match)
        let userPreference = 50;
        if (preferences?.timeSlots) {
          const slotTime = startTime.toTimeString().slice(0, 5);
          if (preferences.timeSlots.includes(slotTime)) {
            userPreference = 90;
          }
        }

        const totalScore = (timeConvenience + popularity + priceValue + userPreference) / 4;

        return {
          slotId: slot.id,
          facilityId: slot.facilityId,
          startAt: slot.startAt,
          endAt: slot.endAt,
          score: totalScore,
          reason: this.getRecommendationReason(totalScore, timeConvenience, popularity),
          factors: {
            popularity,
            userPreference,
            timeConvenience,
            priceValue
          }
        };
      });

      // Sort by score and return top recommendations
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    } catch (error) {
      console.error("폴백 추천 실패:", error);
      return [];
    }
  }

  private static getRecommendationReason(score: number, timeConvenience: number, popularity: number): string {
    if (score >= 80) return "최고의 선택! 지금 시간에 딱 맞는 슬롯입니다";
    if (score >= 60) return "좋은 선택! 당신에게 적합한 시간입니다";
    if (score >= 40) return "괜찮은 선택! 시간을 고려해보세요";
    return "기본 옵션";
  }

  // Trust policy enforcement
  static async enforceTrustPolicyBeforeReserve(userId: string, facilityId: string): Promise<void> {
    const trustCheck = await this.checkUserTrustPolicy(userId);
    const trustPolicy = await this.getTrustPolicy(facilityId);
    
    if (trustCheck.score < trustPolicy.minScoreForBooking) {
      throw new Error(`신뢰도 ${trustPolicy.minScoreForBooking} 미만: 예약이 제한됩니다`);
    }
    
    if (trustCheck.score < trustPolicy.minScoreForNoPrepayment) {
      throw new Error(`신뢰도 ${trustPolicy.minScoreForNoPrepayment} 미만: 선전결제가 필요합니다`);
    }
    
    if (trustCheck.score < trustPolicy.minScoreForUnlimited) {
      const dailyBookings = await this.getUserDailyBookings(userId, facilityId);
      if (dailyBookings >= trustPolicy.dailyLimitForLowTrust) {
        throw new Error(`신뢰도 ${trustPolicy.minScoreForUnlimited} 미만: 하루 ${trustPolicy.dailyLimitForLowTrust}건 제한`);
      }
    }
  }

  // Get user trust policy
  private static async checkUserTrustPolicy(userId: string): Promise<{
    score: number;
    grade: string;
    restrictions: string[];
  }> {
    try {
      const userTrustRef = doc(db, "user_trust_stats", userId);
      const userTrustSnap = await userTrustRef.get();
      
      if (!userTrustSnap.exists()) {
        return {
          score: 50, // Default score for new users
          grade: "C",
          restrictions: []
        };
      }

      const userTrust = userTrustSnap.data() as UserTrustStats;
      const restrictions: string[] = [];

      // Check for penalties
      if (userTrust.penalties.noShowCount > 3) {
        restrictions.push("노쇼 이력으로 제한된 예약 제한");
      }

      if (userTrust.penalties.lateCancelCount > 5) {
        restrictions.push("늦은 취소 이력으로 제한된 예약 제한");
      }

      return {
        score: userTrust.trustScore,
        grade: userTrust.trustGrade,
        restrictions
      };
    } catch (error) {
      console.error("신뢰도 정책 확인 실패:", error);
      return {
        score: 50,
        grade: "C",
        restrictions: []
      };
    }
  }

  // Get facility trust policy
  private static async getTrustPolicy(facilityId: string): Promise<TrustPolicy> {
    try {
      const policyRef = doc(db, "facility_trust_policies", facilityId);
      const policySnap = await policyRef.get();
      
      if (policySnap.exists()) {
        return policySnap.data() as TrustPolicy;
      }
      
      return DEFAULT_TRUST_POLICY;
    } catch (error) {
      console.error("신뢰도 정책 조회 실패:", error);
      return DEFAULT_TRUST_POLICY;
    }
  }

  // Get user daily bookings
  private static async getUserDailyBookings(userId: string, facilityId: string): Promise<number> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const bookingsQuery = query(
        collection(db, "reservations"),
        where("userId", "==", userId),
        where("facilityId", "==", facilityId),
        where("status", "==", "active"),
        where("createdAt", ">=", Timestamp.fromDate(startOfDay)),
        where("createdAt", "<", Timestamp.fromDate(endOfDay))
      );

      const snapshot = await getDocs(bookingsQuery);
      return snapshot.size;
    } catch (error) {
      console.error("일일 예약 수 조회 실패:", error);
      return 0;
    }
  }

  // Update user trust stats
  private static async updateUserTrustStats(userId: string, action: "booking" | "attendance" | "noShow" | "cancel"): Promise<void> {
    try {
      const userTrustRef = doc(db, "user_trust_stats", userId);
      
      await updateDoc(userTrustRef, {
        [`penalties.${action}Count`]: serverTimestamp(),
        lastStatsUpdate: serverTimestamp()
      });
    } catch (error) {
      console.error("신뢰도 통계 업데이트 실패:", error);
    }
  }

  // Generate recurring slots from template
  static async generateRecurringSlots(
    templateId: string, 
    startDate: string, 
    endDate: string,
    excludeDates?: string[]
  ): Promise<{ success: boolean; generatedCount: number; error?: string }> {
    try {
      const generateFn = httpsCallable(functions, 'generateRecurringSlotsFn');
      const result = await generateFn({
        templateId,
        startDate,
        endDate,
        excludeDates
      });
      
      if (result.data && typeof result.data === 'object') {
        const data = result.data as any;
        return {
          success: true,
          generatedCount: data.generatedCount || 0
        };
      }
      
      return { success: false, generatedCount: 0, error: "생성 결과를 확인할 수 없습니다." };
    } catch (error: any) {
      console.error("반복 슬롯 생성 실패:", error);
      return { 
        success: false, 
        generatedCount: 0, 
        error: error.message || "반복 슬롯 생성에 실패했습니다." 
      };
    }
  }

  // Enhanced user reservations with slot details
  static async getUserReservations(): Promise<any[]> {
    try {
      const user = auth.currentUser;
      if (!user) return [];

      const resvQuery = query(
        collection(db, "reservations"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(resvQuery);
      const reservations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Enrich with slot information
      const enrichedReservations = await Promise.all(
        reservations.map(async (reservation) => {
          try {
            const slotRef = doc(db, "facility_slots", reservation.slotId);
            const slotSnap = await slotRef.get();
            
            if (slotSnap.exists()) {
              const slot = slotSnap.data();
              return {
                ...reservation,
                slotInfo: slot
              };
            }
            
            return reservation;
          } catch (error) {
            console.error("슬롯 정보 조회 실패:", error);
            return reservation;
          }
        })
      );

      return enrichedReservations;
    } catch (error) {
      console.error("예약 목록 조회 실패:", error);
      return [];
    }
  }

  // Enhanced facility slots with date filtering
  static async getFacilitySlots(
    facilityId: string, 
    dateKey: string,
    status?: 'available' | 'full' | 'cancelled' | 'maintenance'
  ): Promise<any[]> {
    try {
      let slotsQuery = query(
        collection(db, "facility_slots"),
        where("facilityId", "==", facilityId),
        where("dateKey", "==", dateKey),
        orderBy("startAt", "asc")
      );

      if (status) {
        slotsQuery = query(slotsQuery, where("status", "==", status));
      }

      const snapshot = await getDocs(slotsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("슬롯 목록 조회 실패:", error);
      return [];
    }
  }

  // Enhanced reservation cancellation
  static async cancelReservation(reservationId: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { ok: false, error: "로그인이 필요합니다." };
      }

      const cancelFn = httpsCallable(functions, 'cancelReservationFn');
      const result = await cancelFn({ reservationId });
      
      // Update user trust stats
      await this.updateUserTrustStats(user.uid, "cancel");
      
      return { ok: true };
    } catch (error: any) {
      console.error("예약 취소 실패:", error);
      
      let errorMessage = "예약 취소에 실패했습니다.";
      if (error.code === "functions/failed-precondition") {
        if (error.message.includes("ALREADY_CANCELED")) {
          errorMessage = "이미 취소된 예약입니다.";
        } else if (error.message.includes("CANCEL_TOO_LATE")) {
          errorMessage = "시작 30분까지만 취소 가능합니다.";
        }
      } else if (error.code === "functions/permission-denied") {
        errorMessage = "취소 권한이 없습니다.";
      } else if (error.code === "functions/not-found") {
        errorMessage = "예약을 찾을 수 없습니다.";
      }

      return { ok: false, error: errorMessage };
    }
  }

  // Enhanced reservation details with slot info
  static async getReservationWithSlot(reservationId: string): Promise<any> {
    try {
      const resvRef = doc(db, "reservations", reservationId);
      const resvSnap = await resvRef.get();
      
      if (!resvSnap.exists()) return null;
      
      const reservation = resvSnap.data();
      
      // Get slot information
      if (reservation.slotId) {
        const slotRef = doc(db, "facility_slots", reservation.slotId);
        const slotSnap = await slotRef.get();
        
        if (slotSnap.exists()) {
          const slot = slotSnap.data();
          return {
            ...reservation,
            slotInfo: slot
          };
        }
      }
      
      return reservation;
    } catch (error) {
      console.error("예약 상세 조회 실패:", error);
      return null;
    }
  }

  // Check-in functionality
  static async checkInReservation(reservationId: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { ok: false, error: "로그인이 필요합니다." };
      }

      const checkInFn = httpsCallable(functions, 'checkInReservationFn');
      await checkInFn({ reservationId });
      
      // Update user trust stats
      await this.updateUserTrustStats(user.uid, "attendance");
      
      return { ok: true };
    } catch (error: any) {
      console.error("체크인 실패:", error);
      return { ok: false, error: "체크인에 실패했습니다." };
    }
  }

  // Get facility statistics
  static async getFacilityStats(facilityId: string): Promise<any> {
    try {
      const statsFn = httpsCallable(functions, 'getFacilityStatsFn');
      const result = await statsFn({ facilityId });
      
      if (result.data) {
        return result.data;
      }
      
      return null;
    } catch (error) {
      console.error("시설 통계 조회 실패:", error);
      return null;
    }
  }

  // ===== SUBSCRIPTION & MEMBERSHIP METHODS =====

  /**
   * Get user's active subscription
   */
  static async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      const subscriptionRef = doc(db, 'subscriptions', userId);
      const subscriptionSnap = await getDoc(subscriptionRef);
      
      if (!subscriptionSnap.exists()) {
        return null;
      }
      
      const subscription = subscriptionSnap.data() as Subscription;
      return subscription.status === 'active' ? subscription : null;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      return null;
    }
  }

  /**
   * Refill subscription credits (called by daily batch)
   */
  static async refillSubscriptionCredits(subscriptionId: string): Promise<boolean> {
    try {
      const subscriptionRef = doc(db, 'subscriptions', subscriptionId);
      const subscriptionSnap = await getDoc(subscriptionRef);
      
      if (!subscriptionSnap.exists()) {
        return false;
      }
      
      const subscription = subscriptionSnap.data() as Subscription;
      
      if (subscription.status !== 'active') {
        return false;
      }
      
      // Calculate next refill date
      const nextRefill = this.calculateNextRefillDate(
        subscription.cycleStartDate,
        subscription.cycleType
      );
      
      // Update subscription
      await updateDoc(subscriptionRef, {
        currentCredits: subscription.creditsPerCycle,
        nextRefillDate: nextRefill,
        lastRefillAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Error refilling subscription credits:', error);
      return false;
    }
  }

  /**
   * Calculate next refill date based on cycle type
   */
  private static calculateNextRefillDate(startDate: string, cycleType: string): string {
    const start = new Date(startDate);
    const today = new Date();
    
    switch (cycleType) {
      case 'daily':
        return today.toISOString().split('T')[0];
      case 'weekly':
        start.setDate(start.getDate() + 7);
        return start.toISOString().split('T')[0];
      case 'monthly':
        start.setMonth(start.getMonth() + 1);
        return start.toISOString().split('T')[0];
      case 'yearly':
        start.setFullYear(start.getFullYear() + 1);
        return start.toISOString().split('T')[0];
      default:
        return today.toISOString().split('T')[0];
    }
  }

  // ===== COUPON & DISCOUNT METHODS =====

  /**
   * Get available coupons for a user and facility
   */
  static async getAvailableCoupons(
    userId: string,
    facilityId: string,
    amount: number
  ): Promise<Coupon[]> {
    try {
      const now = new Date().toISOString();
      
      const couponsQuery = query(
        collection(db, 'coupons'),
        where('isActive', '==', true),
        where('validFrom', '<=', now),
        where('validUntil', '>=', now)
      );
      
      const couponsSnap = await getDocs(couponsQuery);
      const availableCoupons: Coupon[] = [];
      
      for (const doc of couponsSnap.docs) {
        const coupon = doc.data() as Coupon;
        
        // Check if coupon is valid for this user and facility
        if (this.isCouponValidForUser(coupon, userId, facilityId, amount)) {
          availableCoupons.push(coupon);
        }
      }
      
      return availableCoupons;
    } catch (error) {
      console.error('Error getting available coupons:', error);
      return [];
    }
  }

  /**
   * Check if coupon is valid for user and facility
   */
  private static isCouponValidForUser(
    coupon: Coupon,
    userId: string,
    facilityId: string,
    amount: number
  ): boolean {
    // Check usage limits
    if (coupon.currentUsage >= coupon.maxUsage) {
      return false;
    }
    
    // Check facility restrictions
    if (coupon.facilityIds.length > 0 && !coupon.facilityIds.includes(facilityId)) {
      return false;
    }
    
    // Check amount restrictions
    if (amount < coupon.minAmount) {
      return false;
    }
    
    // Check user exclusions
    if (coupon.excludeUsers.includes(userId)) {
      return false;
    }
    
    return true;
  }

  /**
   * Apply coupon to a booking
   */
  static async applyCoupon(
    couponCode: string,
    userId: string,
    facilityId: string,
    amount: number
  ): Promise<Coupon | null> {
    try {
      const couponQuery = query(
        collection(db, 'coupons'),
        where('code', '==', couponCode),
        where('isActive', '==', true)
      );
      
      const couponSnap = await getDocs(couponQuery);
      
      if (couponSnap.empty) {
        return null;
      }
      
      const coupon = couponSnap.docs[0].data() as Coupon;
      
      if (!this.isCouponValidForUser(coupon, userId, facilityId, amount)) {
        return null;
      }
      
      return coupon;
    } catch (error) {
      console.error('Error applying coupon:', error);
      return null;
    }
  }

  // ===== PRICING & BENEFITS METHODS =====

  /**
   * Compute final price with subscription credits and coupon discounts
   */
  static async computePriceAndConsume(
    userId: string,
    facilityId: string,
    slotPrice: number,
    couponCode?: string
  ): Promise<PriceCalculation> {
    try {
      // Get user subscription
      const subscription = await this.getUserSubscription(userId);
      
      // Get available coupons
      const availableCoupons = await this.getAvailableCoupons(userId, facilityId, slotPrice);
      
      // Apply coupon if provided
      let appliedCoupon: Coupon | null = null;
      if (couponCode) {
        appliedCoupon = await this.applyCoupon(couponCode, userId, facilityId, slotPrice);
      }
      
      let finalPrice = slotPrice;
      let subscriptionCredits = 0;
      let subscriptionDiscount = 0;
      let couponDiscount = 0;
      let creditsUsed = 0;
      let creditsRemaining = subscription?.currentCredits || 0;
      
      // Step 1: Apply subscription credits
      if (subscription && subscription.currentCredits > 0) {
        const creditsNeeded = Math.ceil(slotPrice / 1000); // Assume 1 credit = 1000 KRW
        creditsUsed = Math.min(creditsNeeded, subscription.currentCredits);
        subscriptionCredits = creditsUsed * 1000;
        subscriptionDiscount = Math.min(subscriptionCredits, slotPrice);
        finalPrice = Math.max(0, slotPrice - subscriptionDiscount);
        creditsRemaining = subscription.currentCredits - creditsUsed;
      }
      
      // Step 2: Apply coupon discount to remaining amount
      if (appliedCoupon && finalPrice > 0) {
        if (appliedCoupon.discountType === 'percentage') {
          couponDiscount = (finalPrice * appliedCoupon.discountValue) / 100;
        } else {
          couponDiscount = Math.min(appliedCoupon.discountValue, finalPrice);
        }
        
        // Apply maximum discount limit
        if (appliedCoupon.maxDiscount > 0) {
          couponDiscount = Math.min(couponDiscount, appliedCoupon.maxDiscount);
        }
        
        finalPrice = Math.max(0, finalPrice - couponDiscount);
      }
      
      return {
        originalPrice: slotPrice,
        subscriptionCredits,
        subscriptionDiscount,
        couponDiscount,
        finalPrice,
        creditsUsed,
        creditsRemaining,
        couponCode: appliedCoupon?.code,
        couponName: appliedCoupon?.name,
        canBookImmediately: finalPrice === 0,
        requiresPayment: finalPrice > 0,
        paymentAmount: finalPrice
      };
    } catch (error) {
      console.error('Error computing price:', error);
      return {
        originalPrice: slotPrice,
        subscriptionCredits: 0,
        subscriptionDiscount: 0,
        couponDiscount: 0,
        finalPrice: slotPrice,
        creditsUsed: 0,
        creditsRemaining: 0,
        canBookImmediately: false,
        requiresPayment: true,
        paymentAmount: slotPrice
      };
    }
  }

  /**
   * Start reservation with benefits (subscription + coupons)
   */
  static async startReserveWithBenefits(
    userId: string,
    slotId: string,
    facilityId: string,
    couponCode?: string,
    notes?: string
  ): Promise<{ success: boolean; reservationId?: string; requiresPayment: boolean; paymentAmount: number; error?: string }> {
    try {
      // Get slot information
      const slotRef = doc(db, 'facilitySlots', slotId);
      const slotSnap = await getDoc(slotRef);
      
      if (!slotSnap.exists()) {
        return { 
          success: false, 
          requiresPayment: false, 
          paymentAmount: 0,
          error: '슬롯을 찾을 수 없습니다.' 
        };
      }
      
      const slot = slotSnap.data() as FacilitySlot;
      
      // Compute price with benefits
      const priceCalculation = await this.computePriceAndConsume(
        userId,
        facilityId,
        slot.price,
        couponCode
      );
      
      // If price is 0, book immediately
      if (priceCalculation.canBookImmediately) {
        const reservation = await this.createReservation({
          userId,
          slotId,
          facilityId,
          price: slot.price,
          notes: notes || ''
        });
        
        // Consume subscription credits if used
        if (priceCalculation.creditsUsed > 0) {
          await this.consumeSubscriptionCredits(userId, priceCalculation.creditsUsed);
        }
        
        // Record coupon usage if applied
        if (couponCode) {
          await this.recordCouponUsage(couponCode, userId, slotId, facilityId, priceCalculation);
        }
        
        return {
          success: true,
          reservationId: reservation.reservationId || '',
          requiresPayment: false,
          paymentAmount: 0
        };
      }
      
      // If payment required, return payment information
      return {
        success: true,
        requiresPayment: true,
        paymentAmount: priceCalculation.paymentAmount
      };
    } catch (error) {
      console.error('Error starting reservation with benefits:', error);
      return {
        success: false,
        requiresPayment: false,
        paymentAmount: 0,
        error: error instanceof Error ? error.message : '예약을 시작할 수 없습니다.'
      };
    }
  }

  /**
   * Consume subscription credits
   */
  private static async consumeSubscriptionCredits(userId: string, creditsToConsume: number): Promise<void> {
    try {
      const subscriptionRef = doc(db, 'subscriptions', userId);
      await updateDoc(subscriptionRef, {
        currentCredits: increment(-creditsToConsume),
        totalCreditsUsed: increment(creditsToConsume),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error consuming subscription credits:', error);
    }
  }

  /**
   * Record coupon usage
   */
  private static async recordCouponUsage(
    couponCode: string,
    userId: string,
    slotId: string,
    facilityId: string,
    priceCalculation: PriceCalculation
  ): Promise<void> {
    try {
      const couponUsage: Omit<CouponUsage, 'id'> = {
        couponId: couponCode,
        userId,
        reservationId: '', // Will be set after reservation creation
        facilityId,
        originalAmount: priceCalculation.originalPrice,
        discountAmount: priceCalculation.couponDiscount,
        finalAmount: priceCalculation.finalPrice,
        usedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };
      
      await addDoc(collection(db, 'couponUsage'), couponUsage);
      
      // Update coupon usage count
      const couponQuery = query(collection(db, 'coupons'), where('code', '==', couponCode));
      const couponSnap = await getDocs(couponQuery);
      
      if (!couponSnap.empty) {
        const couponRef = doc(db, 'coupons', couponSnap.docs[0].id);
        await updateDoc(couponRef, {
          currentUsage: increment(1),
          totalDiscountGiven: increment(priceCalculation.couponDiscount),
          totalBookings: increment(1),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error recording coupon usage:', error);
    }
  }

  // ===== ADMIN METHODS =====

  /**
   * Get coupon statistics for admin dashboard
   */
  static async getCouponStats(): Promise<CouponStats[]> {
    try {
      const couponsQuery = query(collection(db, 'coupons'));
      const couponsSnap = await getDocs(couponsQuery);
      
      const couponStats: CouponStats[] = [];
      
      for (const doc of couponsSnap.docs) {
        const coupon = doc.data() as Coupon;
        
        // Get usage statistics
        const usageQuery = query(
          collection(db, 'couponUsage'),
          where('couponId', '==', coupon.code)
        );
        const usageSnap = await getDocs(usageQuery);
        
        const totalUsage = usageSnap.size;
        let totalDiscount = 0;
        const usageByFacility: Record<string, number> = {};
        const usageByUser: Record<string, number> = {};
        let lastUsedAt: string | undefined;
        
        usageSnap.forEach(usageDoc => {
          const usage = usageDoc.data() as CouponUsage;
          totalDiscount += usage.discountAmount;
          
          // Count by facility
          usageByFacility[usage.facilityId] = (usageByFacility[usage.facilityId] || 0) + 1;
          
          // Count by user
          usageByUser[usage.userId] = (usageByUser[usage.userId] || 0) + 1;
          
          // Track last usage
          if (!lastUsedAt || usage.usedAt > lastUsedAt) {
            lastUsedAt = usage.usedAt;
          }
        });
        
        couponStats.push({
          couponId: coupon.id,
          couponCode: coupon.code,
          totalUsage,
          totalDiscount,
          averageDiscount: totalUsage > 0 ? totalDiscount / totalUsage : 0,
          usageByFacility,
          usageByUser,
          lastUsedAt
        });
      }
      
      return couponStats;
    } catch (error) {
      console.error('Error getting coupon stats:', error);
      return [];
    }
  }

  /**
   * Get subscription statistics for admin dashboard
   */
  static async getSubscriptionStats(): Promise<SubscriptionStats> {
    try {
      const subscriptionsQuery = query(collection(db, 'subscriptions'));
      const subscriptionsSnap = await getDocs(subscriptionsQuery);
      
      let totalSubscriptions = 0;
      let activeSubscriptions = 0;
      let totalCreditsIssued = 0;
      let totalCreditsUsed = 0;
      const planDistribution: Record<string, number> = {};
      const revenueByPlan: Record<string, number> = {};
      
      subscriptionsSnap.forEach(doc => {
        const subscription = doc.data() as Subscription;
        totalSubscriptions++;
        
        if (subscription.status === 'active') {
          activeSubscriptions++;
          totalCreditsIssued += subscription.creditsPerCycle;
          totalCreditsUsed += subscription.totalCreditsUsed;
          
          // Count by plan
          planDistribution[subscription.planType] = (planDistribution[subscription.planType] || 0) + 1;
          
          // Calculate revenue
          revenueByPlan[subscription.planType] = (revenueByPlan[subscription.planType] || 0) + subscription.pricePerCycle;
        }
      });
      
      return {
        totalSubscriptions,
        activeSubscriptions,
        totalCreditsIssued,
        totalCreditsUsed,
        averageCreditsPerUser: activeSubscriptions > 0 ? totalCreditsIssued / activeSubscriptions : 0,
        planDistribution,
        revenueByPlan
      };
    } catch (error) {
      console.error('Error getting subscription stats:', error);
      return {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        totalCreditsIssued: 0,
        totalCreditsUsed: 0,
        averageCreditsPerUser: 0,
        planDistribution: {},
        revenueByPlan: {}
      };
    }
  }
}