export type OfficialRole = 'referee' | 'ar1' | 'ar2' | 'table' | 'umpire';

export interface OfficialProfile {
  uid: string;
  name?: string;
  grade?: string;
  badges?: string[];
  active?: boolean;
}

export interface OfficialAssignment {
  uid: string;
  role: OfficialRole;
  assignedAt: number;
  notes?: string;
}

export interface MatchEvent {
  t: number;
  teamId?: string;
  type: 'goal' | 'own_goal' | 'yellow' | 'red' | 'sub' | 'note';
  player?: string;
  minute?: number;
  value?: number;
  note?: string;
}

export interface MatchReport {
  id: string;
  clubId: string;
  fixtureId: string;
  homeTeamId: string;
  awayTeamId: string;
  events: MatchEvent[];
  score: { home: number; away: number };
  mvp?: { teamId: string; name: string };
  attendance?: number;
  officials?: OfficialAssignment[];
  createdAt: number;
  updatedAt: number;
  submittedBy?: string;
  locked?: boolean;
}
