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

  // ?¨Ïö©???†Ìò∏??Î∂ÑÏÑù
  const analyzeUserPreferences = useCallback(async (uid: string) => {
    try {
      // 1. ?¨Ïö©?êÏùò Ï∂úÏÑù???àÏïΩ ?∞Ïù¥??Î∂ÑÏÑù
      const attendedQuery = query(
        collection(db, "reservations"),
        where("userId", "==", uid),
        where("status", "==", "attended"),
        orderBy("createdAt", "desc"),
        limit(50)
      );

      const attendedSnap = await getDocs(attendedQuery);
      const preferences = {
        preferredDays: new Map<number, number>(), // 0-6 (?ºÏöî???†Ïöî??
        preferredTimeRanges: new Map<string, number>(), // "9-12", "14-17" ??
        preferredFacilities: new Map<string, number>(), // ?úÏÑ§Î≥??†Ìò∏??
        avgRating: 0
      };

      let totalRating = 0;
      let ratingCount = 0;

      attendedSnap.forEach(doc => {
        const data = doc.data();
        const startAt = data.startAt?.toDate() || new Date();
        
        // ?îÏùº ?†Ìò∏??
        const dayOfWeek = startAt.getDay();
        preferences.preferredDays.set(
          dayOfWeek, 
          (preferences.preferredDays.get(dayOfWeek) || 0) + 1
        );

        // ?úÍ∞Ñ?Ä ?†Ìò∏??
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

        // ?úÏÑ§ ?†Ìò∏??
        preferences.preferredFacilities.set(
          data.facilityId,
          (preferences.preferredFacilities.get(data.facilityId) || 0) + 1
        );
      });

      // 2. ?¨Ïö©?êÍ? ?ëÏÑ±???ÑÍ∏∞ ?âÏ†ê Î∂ÑÏÑù
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
      console.error("?¨Ïö©???†Ìò∏??Î∂ÑÏÑù ?§Ìå®:", error);
      return null;
    }
  }, []);

  // ?¨Î°Ø Ï∂îÏ≤ú ?êÏàò Í≥ÑÏÇ∞
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

    // 1. ?úÍ∞Ñ ?†Ìò∏???êÏàò (0-30??
    if (userPreferences) {
      const startAt = slot.startAt?.toDate() || new Date();
      const dayOfWeek = startAt.getDay();
      const hour = startAt.getHours();
      
      // ?îÏùº ?†Ìò∏??
      const dayPreference = userPreferences.preferredDays.get(dayOfWeek) || 0;
      const maxDayPreference = Math.max(...Array.from(userPreferences.preferredDays.values()));
      if (maxDayPreference > 0) {
        factors.timePreference += (dayPreference / maxDayPreference) * 15;
      }

      // ?úÍ∞Ñ?Ä ?†Ìò∏??
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

    // 2. ?úÏÑ§ ?âÏ†ê ?êÏàò (0-25??
    if (facility.avgRating) {
      factors.facilityRating = (facility.avgRating / 5) * 25;
    }

    // 3. ?∏Í∏∞???êÏàò (0-20??
    const reservationRate = slot.reserved / slot.capacity;
    factors.popularity = reservationRate * 20;

    // 4. ?ÑÎ∞ï???êÏàò (0-15??
    const now = new Date();
    const timeUntilStart = slot.startAt?.toDate().getTime() - now.getTime();
    const hoursUntilStart = timeUntilStart / (1000 * 60 * 60);
    
    if (hoursUntilStart > 0 && hoursUntilStart < 24) {
      factors.urgency = Math.max(0, 15 - hoursUntilStart);
    }

    // 5. Í∞Ä?©ÏÑ± ?êÏàò (0-10??
    const availability = Math.max(0, slot.capacity - slot.reserved);
    factors.availability = Math.min(10, availability);

    // ?ÑÌÑ∞ ?ÅÏö©
    if (filters.maxPrice && slot.price && slot.price > filters.maxPrice) {
      return { ...slot, score: 0, factors } as SlotRecommendationScore;
    }

    if (filters.minRating && facility.avgRating < filters.minRating) {
      return { ...slot, score: 0, factors } as SlotRecommendationScore;
    }

    if (filters.preferredDays && !filters.preferredDays.includes(dayOfWeek)) {
      factors.timePreference *= 0.5; // ?†Ìò∏?òÏ? ?äÎäî ?îÏùº?Ä ?êÏàò Í∞êÏÜå
    }

    // ÏµúÏ¢Ö ?êÏàò Í≥ÑÏÇ∞
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

  // Ï∂îÏ≤ú ?¨Î°Ø Í∞Ä?∏Ïò§Í∏?
  const fetchRecommendedSlots = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      // 1. ?¨Ïö©???†Ìò∏??Î∂ÑÏÑù
      const userPreferences = await analyzeUserPreferences(userId);
      
      // 2. ?¨Ïö© Í∞Ä?•Ìïú ?¨Î°Ø Ï°∞Ìöå
      const slotsQuery = facilityId 
        ? query(
            collection(db, "facility_slots"),
            where("facilityId", "==", facilityId),
            where("status", "==", "open"),
            where("startAt", ">", Timestamp.now()),
            orderBy("startAt", "asc"),
            limit(maxSlots * 3) // ?ÑÌÑ∞Îß???Ï∂©Î∂Ñ?????ïÎ≥¥
          )
        : query(
            collection(db, "facility_slots"),
            where("status", "==", "open"),
            where("startAt", ">", Timestamp.now()),
            orderBy("startAt", "asc"),
            limit(maxSlots * 5)
          );

      const slotsSnap = await getDocs(slotsQuery);
      
      // 3. ?úÏÑ§ ?ïÎ≥¥ Ï°∞Ìöå
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

      // 4. ?¨Î°ØÎ≥?Ï∂îÏ≤ú ?êÏàò Í≥ÑÏÇ∞
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

      // 5. ?êÏàò???ïÎ†¨ Î∞??ÅÏúÑ ?¨Î°Ø ?†ÌÉù
      scoredSlots.sort((a, b) => b.score - a.score);
      const topSlots = scoredSlots.slice(0, maxSlots);

      setRecommendedSlots(topSlots);
    } catch (error) {
      console.error("Ï∂îÏ≤ú ?¨Î°Ø Ï°∞Ìöå ?§Ìå®:", error);
      setError("Ï∂îÏ≤ú ?¨Î°Ø??Î∂àÎü¨?????ÜÏäµ?àÎã§.");
    } finally {
      setLoading(false);
    }
  }, [userId, facilityId, maxSlots, filters, analyzeUserPreferences, calculateRecommendationScore]);

  // ?òÏ°¥??Î≥ÄÍ≤???Ï∂îÏ≤ú ?¨Î°Ø ?àÎ°úÍ≥†Ïπ®
  useEffect(() => {
    fetchRecommendedSlots();
  }, [fetchRecommendedSlots]);

  // ?òÎèô ?àÎ°úÍ≥†Ïπ®
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
