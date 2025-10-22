export type TeamRole = 'owner' | 'manager' | 'coach' | 'captain' | 'member';

export interface TeamMember {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  role: TeamRole;
  joinedAt: number;
  pending?: boolean; // 초대 대기
}

export interface TeamProfile {
  id: string;
  clubId: string;
  name: string;
  sport: string;
  region?: string;
  logoUrl?: string;
  bannerUrl?: string;
  bio?: string;
  hashtags?: string[];
  createdAt: number;
  updatedAt: number;
  visibility?: 'public' | 'private';
}

export interface Division {
  id: string;
  clubId: string;
  name: string;
  level?: string;
  createdAt: number;
}

export interface Fixture {
  id: string;
  clubId: string;
  divisionId?: string;
  homeTeamId: string;
  awayTeamId: string;
  startAt: number;
  endAt?: number;
  venue?: string;
  status: 'scheduled' | 'finished' | 'cancelled';
  score?: { home: number; away: number };
}

export interface JoinRequest {
  id: string;
  teamId: string;
  fromUid: string;
  message?: string;
  createdAt: number;
  state: 'pending' | 'approved' | 'rejected';
}
