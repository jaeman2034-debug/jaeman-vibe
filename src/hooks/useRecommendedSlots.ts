import { useState, useEffect, useCallback } from "react";
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SlotRecommendationScore, RecommendationFilters } from "@/types/review";

interface UseRecommendedSlotsProps {
  userId?: string;
  facilityId?: string;
  maxSlots?: number;
  filters?: RecommendationFilters;
}

export function useRecommendedSlots({
  userId,
  facilityId,
  maxSlots = 10,
  filters = {}
}: UseRecommendedSlotsProps) {
  const [recommendedSlots, setRecommendedSlots] = useState<SlotRecommendationScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ?�용???�호??분석
  const analyzeUserPreferences = useCallback(async (uid: string) => {
    try {
      // 1. ?�용?�의 출석???�약 ?�이??분석
      const attendedQuery = query(
        collection(db, "reservations"),
        where("userId", "==", uid),
        where("status", "==", "attended"),
        orderBy("createdAt", "desc"),
        limit(50)
      );

      const attendedSnap = await getDocs(attendedQuery);
      const preferences = {
        preferredDays: new Map<number, number>(), // 0-6 (?�요???�요??
        preferredTimeRanges: new Map<string, number>(), // "9-12", "14-17" ??
        preferredFacilities: new Map<string, number>(), // ?�설�??�호??
        avgRating: 0
      };

      let totalRating = 0;
      let ratingCount = 0;

      attendedSnap.forEach(doc => {
        const data = doc.data();
        const startAt = data.startAt?.toDate() || new Date();
        
        // ?�일 ?�호??
        const dayOfWeek = startAt.getDay();
        preferences.preferredDays.set(
          dayOfWeek, 
          (preferences.preferredDays.get(dayOfWeek) || 0) + 1
        );

        // ?�간?� ?�호??
        const hour = startAt.getHours();
        let timeRange = "";
        if (hour < 9) timeRange = "6-9";
        else if (hour < 12) timeRange = "9-12";
        else if (hour < 14) timeRange = "12-14";
        else if (hour < 17) timeRange = "14-17";
        else if (hour < 21) timeRange = "17-21";
        else timeRange = "21-24";

        preferences.preferredTimeRanges.set(
          timeRange,
          (preferences.preferredTimeRanges.get(timeRange) || 0) + 1
        );

        // ?�설 ?�호??
        preferences.preferredFacilities.set(
          data.facilityId,
          (preferences.preferredFacilities.get(data.facilityId) || 0) + 1
        );
      });

      // 2. ?�용?��? ?�성???�기 ?�점 분석
      const reviewsQuery = query(
        collection(db, "reviews"),
        where("userId", "==", uid),
        where("status", "==", "active")
      );

      const reviewsSnap = await getDocs(reviewsQuery);
      reviewsSnap.forEach(doc => {
        const data = doc.data();
        totalRating += data.rating;
        ratingCount++;
      });

      if (ratingCount > 0) {
        preferences.avgRating = totalRating / ratingCount;
      }

      return preferences;
    } catch (error) {
      console.error("?�용???�호??분석 ?�패:", error);
      return null;
    }
  }, []);

  // ?�롯 추천 ?�수 계산
  const calculateRecommendationScore = useCallback((
    slot: any,
    facility: any,
    userPreferences: any,
    filters: RecommendationFilters
  ): SlotRecommendationScore => {
    let score = 0;
    const factors = {
      timePreference: 0,
      facilityRating: 0,
      popularity: 0,
      urgency: 0,
      availability: 0
    };

    // 1. ?�간 ?�호???�수 (0-30??
    if (userPreferences) {
      const startAt = slot.startAt?.toDate() || new Date();
      const dayOfWeek = startAt.getDay();
      const hour = startAt.getHours();
      
      // ?�일 ?�호??
      const dayPreference = userPreferences.preferredDays.get(dayOfWeek) || 0;
      const maxDayPreference = Math.max(...Array.from(userPreferences.preferredDays.values()));
      if (maxDayPreference > 0) {
        factors.timePreference += (dayPreference / maxDayPreference) * 15;
      }

      // ?�간?� ?�호??
      let timeRange = "";
      if (hour < 9) timeRange = "6-9";
      else if (hour < 12) timeRange = "9-12";
      else if (hour < 14) timeRange = "12-14";
      else if (hour < 17) timeRange = "14-17";
      else if (hour < 21) timeRange = "17-21";
      else timeRange = "21-24";

      const timePreference = userPreferences.preferredTimeRanges.get(timeRange) || 0;
      const maxTimePreference = Math.max(...Array.from(userPreferences.preferredTimeRanges.values()));
      if (maxTimePreference > 0) {
        factors.timePreference += (timePreference / maxTimePreference) * 15;
      }
    }

    // 2. ?�설 ?�점 ?�수 (0-25??
    if (facility.avgRating) {
      factors.facilityRating = (facility.avgRating / 5) * 25;
    }

    // 3. ?�기???�수 (0-20??
    const reservationRate = slot.reserved / slot.capacity;
    factors.popularity = reservationRate * 20;

    // 4. ?�박???�수 (0-15??
    const now = new Date();
    const timeUntilStart = slot.startAt?.toDate().getTime() - now.getTime();
    const hoursUntilStart = timeUntilStart / (1000 * 60 * 60);
    
    if (hoursUntilStart > 0 && hoursUntilStart < 24) {
      factors.urgency = Math.max(0, 15 - hoursUntilStart);
    }

    // 5. 가?�성 ?�수 (0-10??
    const availability = Math.max(0, slot.capacity - slot.reserved);
    factors.availability = Math.min(10, availability);

    // ?�터 ?�용
    if (filters.maxPrice && slot.price && slot.price > filters.maxPrice) {
      return { ...slot, score: 0, factors } as SlotRecommendationScore;
    }

    if (filters.minRating && facility.avgRating < filters.minRating) {
      return { ...slot, score: 0, factors } as SlotRecommendationScore;
    }

    if (filters.preferredDays && !filters.preferredDays.includes(dayOfWeek)) {
      factors.timePreference *= 0.5; // ?�호?��? ?�는 ?�일?� ?�수 감소
    }

    // 최종 ?�수 계산
    score = factors.timePreference + factors.facilityRating + 
            factors.popularity + factors.urgency + factors.availability;

    return {
      slotId: slot.id,
      facilityId: slot.facilityId,
      score: Math.round(score * 100) / 100,
      factors,
      slot: {
        startAt: slot.startAt?.toDate() || new Date(),
        endAt: slot.endAt?.toDate() || new Date(),
        capacity: slot.capacity,
        reserved: slot.reserved,
        price: slot.price
      },
      facility: {
        name: facility.name,
        avgRating: facility.avgRating || 0,
        reviewCount: facility.reviewCount || 0
      }
    };
  }, []);

  // 추천 ?�롯 가?�오�?
  const fetchRecommendedSlots = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      // 1. ?�용???�호??분석
      const userPreferences = await analyzeUserPreferences(userId);
      
      // 2. ?�용 가?�한 ?�롯 조회
      const slotsQuery = facilityId 
        ? query(
            collection(db, "facility_slots"),
            where("facilityId", "==", facilityId),
            where("status", "==", "open"),
            where("startAt", ">", Timestamp.now()),
            orderBy("startAt", "asc"),
            limit(maxSlots * 3) // ?�터�???충분?????�보
          )
        : query(
            collection(db, "facility_slots"),
            where("status", "==", "open"),
            where("startAt", ">", Timestamp.now()),
            orderBy("startAt", "asc"),
            limit(maxSlots * 5)
          );

      const slotsSnap = await getDocs(slotsQuery);
      
      // 3. ?�설 ?�보 조회
      const facilityIds = new Set(slotsSnap.docs.map(doc => doc.data().facilityId));
      const facilitiesQuery = query(
        collection(db, "facilities"),
        where("__name__", "in", Array.from(facilityIds))
      );
      
      const facilitiesSnap = await getDocs(facilitiesQuery);
      const facilities = new Map();
      facilitiesSnap.forEach(doc => {
        facilities.set(doc.id, { id: doc.id, ...doc.data() });
      });

      // 4. ?�롯�?추천 ?�수 계산
      const scoredSlots: SlotRecommendationScore[] = [];
      
      slotsSnap.forEach(doc => {
        const slotData = doc.data();
        const facility = facilities.get(slotData.facilityId);
        
        if (facility) {
          const scoredSlot = calculateRecommendationScore(
            { id: doc.id, ...slotData },
            facility,
            userPreferences,
            filters
          );
          
          if (scoredSlot.score > 0) {
            scoredSlots.push(scoredSlot);
          }
        }
      });

      // 5. ?�수???�렬 �??�위 ?�롯 ?�택
      scoredSlots.sort((a, b) => b.score - a.score);
      const topSlots = scoredSlots.slice(0, maxSlots);

      setRecommendedSlots(topSlots);
    } catch (error) {
      console.error("추천 ?�롯 조회 ?�패:", error);
      setError("추천 ?�롯??불러?????�습?�다.");
    } finally {
      setLoading(false);
    }
  }, [userId, facilityId, maxSlots, filters, analyzeUserPreferences, calculateRecommendationScore]);

  // ?�존??변�???추천 ?�롯 ?�로고침
  useEffect(() => {
    fetchRecommendedSlots();
  }, [fetchRecommendedSlots]);

  // ?�동 ?�로고침
  const refresh = useCallback(() => {
    fetchRecommendedSlots();
  }, [fetchRecommendedSlots]);

  return {
    recommendedSlots,
    loading,
    error,
    refresh
  };
}
