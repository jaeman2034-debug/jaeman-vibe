// src/types/facility.ts
export interface Facility {
  id: string;
  name: string;
  description?: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  images: string[];
  amenities: string[];
  operatingHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
  };
  pricing: {
    hourlyRate: number;
    currency: string;
    discounts?: {
      type: 'percentage' | 'fixed';
      value: number;
      conditions?: string;
    }[];
  };
  capacity: {
    maxPeople: number;
    minPeople?: number;
  };
  rules: string[];
  status: 'active' | 'inactive' | 'maintenance';
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  region: string;
  category: string;
  tags: string[];
  rating?: {
    average: number;
    count: number;
  };
  isVerified: boolean;
  subscriptionPlans?: SubscriptionPlan[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  planType: 'basic' | 'premium' | 'enterprise';
  creditsPerCycle: number;
  maxCreditsRollover: number;
  pricePerCycle: number;
  currency: string;
  cycleType: 'daily' | 'weekly' | 'monthly' | 'yearly';
  maxDailyBookings: number;
  advanceBookingDays: number;
  priorityBooking: boolean;
  exclusiveSlots: boolean;
  discountPercentage: number;
  maxFacilities: number;
  maxConcurrentBookings: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  id: string;
  facilityId: string;
  startTime: string;
  endTime: string;
  date: string;
  isAvailable: boolean;
  isBooked: boolean;
  bookedBy?: string;
  bookingId?: string;
  price: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  facilityId: string;
  userId: string;
  timeSlotId: string;
  startTime: string;
  endTime: string;
  date: string;
  totalPrice: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod?: string;
  paymentId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  cancellationReason?: string;
  cancelledAt?: string;
  refundAmount?: number;
  refundedAt?: string;
}

export interface FacilityReview {
  id: string;
  facilityId: string;
  userId: string;
  bookingId: string;
  rating: number;
  comment?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
  helpful: number;
  notHelpful: number;
}

export interface FacilityAvailability {
  facilityId: string;
  date: string;
  timeSlots: TimeSlot[];
  isFullyBooked: boolean;
  availableSlots: number;
  totalSlots: number;
  lastUpdated: string;
}

export interface FacilitySearchFilters {
  location?: {
    lat: number;
    lng: number;
    radius: number; // in kilometers
  };
  date?: string;
  timeRange?: {
    start: string;
    end: string;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  amenities?: string[];
  capacity?: {
    min: number;
    max?: number;
  };
  category?: string;
  tags?: string[];
  rating?: number;
  isVerified?: boolean;
  hasAvailability?: boolean;
}

export interface FacilitySearchResult {
  facility: Facility;
  distance?: number;
  availableSlots?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  matchScore: number;
}

export interface FacilityStats {
  facilityId: string;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  occupancyRate: number;
  popularTimeSlots: string[];
  monthlyStats: {
    month: string;
    bookings: number;
    revenue: number;
    occupancyRate: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface FacilityNotification {
  id: string;
  facilityId: string;
  userId: string;
  type: 'booking_confirmed' | 'booking_cancelled' | 'payment_received' | 'review_received' | 'maintenance_scheduled';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface FacilityMaintenance {
  id: string;
  facilityId: string;
  title: string;
  description: string;
  scheduledDate: string;
  estimatedDuration: number; // in hours
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  affectedSlots: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  notes?: string;
}

// ===== DEFAULT VALUES =====

export const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic-daily',
    name: 'Basic Daily',
    description: '일일 기본 멤버십',
    planType: 'basic',
    creditsPerCycle: 2,
    maxCreditsRollover: 4,
    pricePerCycle: 5000,
    currency: 'KRW',
    cycleType: 'daily',
    maxDailyBookings: 2,
    advanceBookingDays: 3,
    priorityBooking: false,
    exclusiveSlots: false,
    discountPercentage: 0,
    maxFacilities: 1,
    maxConcurrentBookings: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'premium-monthly',
    name: 'Premium Monthly',
    description: '월간 프리미엄 멤버십',
    planType: 'premium',
    creditsPerCycle: 30,
    maxCreditsRollover: 60,
    pricePerCycle: 50000,
    currency: 'KRW',
    cycleType: 'monthly',
    maxDailyBookings: 5,
    advanceBookingDays: 7,
    priorityBooking: true,
    exclusiveSlots: true,
    discountPercentage: 10,
    maxFacilities: 3,
    maxConcurrentBookings: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const DEFAULT_FACILITY_AMENITIES = [
  'WiFi',
  'Parking',
  'Air Conditioning',
  'Heating',
  'Restrooms',
  'Changing Rooms',
  'Water Fountain',
  'First Aid Kit',
  'Security',
  'Accessibility'
];

export const DEFAULT_FACILITY_CATEGORIES = [
  'Sports',
  'Fitness',
  'Recreation',
  'Meeting',
  'Event',
  'Workshop',
  'Training',
  'Conference',
  'Party',
  'Wedding'
];

export const DEFAULT_TIME_SLOT_DURATION = 60; // minutes
export const DEFAULT_ADVANCE_BOOKING_DAYS = 7;
export const DEFAULT_CANCELLATION_HOURS = 24;

export const DEFAULT_TRUST_POLICY: TrustPolicy = {
  minTrustScore: 0,
  maxTrustScore: 100,
  trustThresholds: {
    low: 30,
    medium: 60,
    high: 80
  },
  penaltyRules: {
    noShow: -10,
    lateCancellation: -5,
    violation: -15
  },
  rewardRules: {
    onTimeArrival: 2,
    earlyCancellation: 1,
    positiveReview: 3
  },
  reviewWeight: 0.3,
  bookingHistoryWeight: 0.4,
  behaviorWeight: 0.3
};