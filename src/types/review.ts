// ?�기/?�점 ?�스???�???�의

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

// ?�기 ?�성 가???��? ?�인
export interface ReviewEligibility {
  canReview: boolean;
  reason?: string;
  reservationId?: string;
  slotId?: string;
  facilityId?: string;
}

// 추천 ?�롯 ?�코?�링
export interface SlotRecommendationScore {
  slotId: string;
  facilityId: string;
  score: number;
  factors: {
    timePreference: number; // ?�용???�호 ?�간?�
    facilityRating: number; // ?�설 ?�점
    popularity: number; // ?�기??(?�약�?
    urgency: number; // ?�박??
    availability: number; // 가?�성
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

// 추천 ?�롯 ?�터 ?�션
export interface RecommendationFilters {
  maxPrice?: number;
  minRating?: number;
  preferredDays?: number[]; // 0-6 (?�요???�요??
  preferredTimeRanges?: Array<{
    startHour: number;
    endHour: number;
  }>;
  maxDistance?: number; // km
  sportTypes?: string[];
}

// ?�기 ?�계
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

// ?�기 검???�터�?
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

// ?�기 ?�고
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

// ?�기 ?��????�시
export interface ReviewHelpful {
  reviewId: string;
  userId: string;
  helpful: boolean; // true: ?��??? false: ?��??�됨
  createdAt: Date;
}

// ?�기 ?�성 ?�한 ?�책
export interface ReviewPolicy {
  minReservations: number; // 최소 ?�약 ??
  minAttendedReservations: number; // 최소 출석 ??
  maxReviewsPerFacility: number; // ?�설??최�? ?�기 ??
  cooldownDays: number; // ?�기 ?�성 ???��?기간
  requireVerification: boolean; // ?�기 검�??�요 ?��?
  autoModeration: boolean; // ?�동 모더?�이??
}

// ?�기 ?�질 ?�수
export interface ReviewQualityScore {
  reviewId: string;
  score: number; // 0-100
  factors: {
    length: number; // ?��? 길이
    detail: number; // ?�세??
    helpfulness: number; // ?��????�시 비율
    authenticity: number; // ?�뢰??
    timeliness: number; // ?�시??
  };
  lastCalculatedAt: Date;
}
