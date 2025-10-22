// 계층형 분류를 위한 타입 정의
export type Sport = 'soccer' | 'basketball' | 'tennis' | 'badminton' | 'volleyball' | 'baseball' | 'swimming' | 'running' | 'cycling' | 'climbing' | 'golf' | 'etc';

export type Branch = 'scrimmage' | 'academy' | 'women_teams' | 'referees' | 'training' | 'league' | 'flash' | 'all';

export type Leaf = string; // 동적으로 생성되는 소가지

export interface Meetup {
  id: string;
  title: string;
  description: string;
  sport: Sport;
  branch?: Branch;
  leaf?: Leaf;
  leafCode?: string; // SEO/URL용 코드
  region: string;
  date: string;
  time: string;
  maxParticipants: number;
  currentParticipants: number;
  price: number;
  location: {
    name: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  organizer: {
    id: string;
    name: string;
    avatar?: string;
  };
  images: string[];
  tags: string[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface MeetupsQuery {
  sport?: Sport | 'all';
  branch?: Branch | 'all';
  leaf?: Leaf | 'all';
  region?: string;
  date?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  status?: string;
  search?: string;
  sortBy?: 'recommended' | 'time' | 'popularity';
}

// 기존 MeetupFilter는 호환성을 위해 유지
export interface MeetupFilter {
  sport?: string;
  region?: string;
  date?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  status?: string;
}

export interface MeetupCreateData {
  title: string;
  description: string;
  sport: string;
  region: string;
  date: string;
  time: string;
  maxParticipants: number;
  price: number;
  location: {
    name: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  images: string[];
  tags: string[];
}

export interface MeetupStats {
  totalMeetups: number;
  upcomingMeetups: number;
  completedMeetups: number;
  totalParticipants: number;
  averageRating: number;
}
