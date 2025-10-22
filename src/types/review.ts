// ?„ê¸°/?‰ì  ?œìŠ¤???€???•ì˜

export interface Review {
  id: string;
  facilityId: string;
  slotId: string;
  userId: string;
  reservationId: string;
  rating: number; // 1-5??
  comment: string;
  createdAt: Date;
  updatedAt?: Date;
  helpfulCount: number;
  reported: boolean;
  status: 'active' | 'hidden' | 'deleted';
}

export interface ReviewFormData {
  rating: number;
  comment: string;
}

export interface FacilityRating {
  facilityId: string;
  avgRating: number;
  reviewCount: number;
  ratingDistribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
  lastUpdatedAt: Date;
}

export interface ReviewWithUser {
  review: Review;
  user: {
    uid: string;
    displayName?: string;
    photoURL?: string;
  };
}

// ?„ê¸° ?‘ì„± ê°€???¬ë? ?•ì¸
export interface ReviewEligibility {
  canReview: boolean;
  reason?: string;
  reservationId?: string;
  slotId?: string;
  facilityId?: string;
}

// ì¶”ì²œ ?¬ë¡¯ ?¤ì½”?´ë§
export interface SlotRecommendationScore {
  slotId: string;
  facilityId: string;
  score: number;
  factors: {
    timePreference: number; // ?¬ìš©??? í˜¸ ?œê°„?€
    facilityRating: number; // ?œì„¤ ?‰ì 
    popularity: number; // ?¸ê¸°??(?ˆì•½ë¥?
    urgency: number; // ?„ë°•??
    availability: number; // ê°€?©ì„±
  };
  slot: {
    startAt: Date;
    endAt: Date;
    capacity: number;
    reserved: number;
    price?: number;
  };
  facility: {
    name: string;
    avgRating: number;
    reviewCount: number;
  };
}

// ì¶”ì²œ ?¬ë¡¯ ?„í„° ?µì…˜
export interface RecommendationFilters {
  maxPrice?: number;
  minRating?: number;
  preferredDays?: number[]; // 0-6 (?¼ìš”??? ìš”??
  preferredTimeRanges?: Array<{
    startHour: number;
    endHour: number;
  }>;
  maxDistance?: number; // km
  sportTypes?: string[];
}

// ?„ê¸° ?µê³„
export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingBreakdown: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
  recentTrend: {
    lastWeek: number;
    lastMonth: number;
    lastQuarter: number;
  };
  helpfulReviews: number;
  reportedReviews: number;
}

// ?„ê¸° ê²€???„í„°ë§?
export interface ReviewFilters {
  rating?: number;
  dateRange?: {
    from: Date;
    to: Date;
  };
  helpful?: boolean;
  hasComment?: boolean;
  sortBy?: 'rating' | 'date' | 'helpful';
  sortOrder?: 'asc' | 'desc';
}

// ?„ê¸° ? ê³ 
export interface ReviewReport {
  id: string;
  reviewId: string;
  reporterId: string;
  reason: 'inappropriate' | 'spam' | 'fake' | 'harassment' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  adminNotes?: string;
}

// ?„ê¸° ?„ì????œì‹œ
export interface ReviewHelpful {
  reviewId: string;
  userId: string;
  helpful: boolean; // true: ?„ì??? false: ?„ì??ˆë¨
  createdAt: Date;
}

// ?„ê¸° ?‘ì„± ?œí•œ ?•ì±…
export interface ReviewPolicy {
  minReservations: number; // ìµœì†Œ ?ˆì•½ ??
  minAttendedReservations: number; // ìµœì†Œ ì¶œì„ ??
  maxReviewsPerFacility: number; // ?œì„¤??ìµœë? ?„ê¸° ??
  cooldownDays: number; // ?„ê¸° ?‘ì„± ???€ê¸?ê¸°ê°„
  requireVerification: boolean; // ?„ê¸° ê²€ì¦??„ìš” ?¬ë?
  autoModeration: boolean; // ?ë™ ëª¨ë”?ˆì´??
}

// ?„ê¸° ?ˆì§ˆ ?ìˆ˜
export interface ReviewQualityScore {
  reviewId: string;
  score: number; // 0-100
  factors: {
    length: number; // ?“ê? ê¸¸ì´
    detail: number; // ?ì„¸??
    helpfulness: number; // ?„ì????œì‹œ ë¹„ìœ¨
    authenticity: number; // ? ë¢°??
    timeliness: number; // ?ì‹œ??
  };
  lastCalculatedAt: Date;
}
